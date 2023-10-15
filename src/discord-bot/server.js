/**
 * The core server.
 */

import 'isomorphic-fetch';
import { createServerAdapter } from '@whatwg-node/server';
import { createServer } from 'node:http';
import { ulid } from 'ulid';
import {
	InteractionResponseFlags,
	InteractionResponseType,
	InteractionType,
	MessageComponentTypes,
	TextStyleTypes,
	verifyKey
} from 'discord-interactions';
import { error, Router } from 'itty-router';
import { kv } from '@vercel/kv';
import { ADD_COMMAND, SELECT_COMMAND } from './commands.js';

class JsonResponse extends Response {
	constructor(body, init) {
		const jsonBody = JSON.stringify(body);
		init = init || {
			headers: {
				'content-type': 'application/json;charset=UTF-8'
			}
		};
		super(jsonBody, init);
	}
}

function validateUserAccess(username) {
	if (!['LuggageMoose', 'encryptoknight'].includes(username)) {
		console.error('Invalid user access');
		return new JsonResponse({ error: 'Invalid user access' }, { status: 403 });
	}
}

const router = Router();

async function getFacts() {
	try {
		const redisScan = (await kv.scan(0, { match: 'fact:*' }))[1] ?? [];
		const facts = await Promise.all(redisScan.map(async (fact) => await kv.hgetall(fact)));
		return facts;
	} catch (error) {
		console.error('Error reading facts:', error);
		return [];
	}
}

async function storeFact(id, fact, is_enabled = true) {
	try {
		await kv.hset(`fact:${id}`, { id, fact, is_enabled });
	} catch (error) {
		const message = 'Error writing facts:';
		console.error(message, error);
		throw new Error(message);
	}
}

async function updateFactsStatus(factIds) {
	try {
		const existingFacts = await getFacts();
		for (const { id, fact } of existingFacts) {
			await kv.hset(`fact:${id}`, {
				id,
				fact,
				is_enabled: factIds.includes(id)
			});
		}
	} catch (error) {
		const message = 'Error writing facts:';
		console.error(message, error);
		throw new Error(message);
	}
}

/**
 * Main route for all requests sent from Discord. All incoming messages will
 * include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
router.post('/', async (request) => {
	const { isValid, interaction } = await verifyDiscordRequest(request);
	if (!isValid || !interaction) {
		return new Response('Bad request signature.', { status: 401 });
	}

	if (interaction.type === InteractionType.PING) {
		// The `PING` message is used during the initial webhook handshake, and is
		// required to configure the webhook in the developer portal.
		return new JsonResponse({
			type: InteractionResponseType.PONG
		});
	}

	if (interaction.type === InteractionType.APPLICATION_COMMAND) {
		const username = interaction.member.user.username;
		const userAccessResponse = validateUserAccess(username);
		if (userAccessResponse) {
			return userAccessResponse;
		}

		// Most user commands will come as `APPLICATION_COMMAND`.
		switch (interaction.data.name.toLowerCase()) {
			case ADD_COMMAND.name.toLowerCase(): {
				return new JsonResponse({
					type: InteractionResponseType.MODAL,
					data: {
						custom_id: 'fact_modal',
						title: `Add a cool Ben's Fact!`,
						components: [
							{
								type: MessageComponentTypes.ACTION_ROW,
								components: [
									{
										type: MessageComponentTypes.INPUT_TEXT,
										custom_id: ulid(),
										style: TextStyleTypes.PARAGRAPH,
										label: "A cool Ben's Fact",
										min_length: 1,
										max_length: 1000,
										required: true
									}
								]
							}
						]
					}
				});
			}
			case SELECT_COMMAND.name.toLowerCase(): {
				const facts = await getFacts();
				const options = facts.map(({ id, fact, is_enabled }) => {
					fact = fact.substring(0, 97).concat('...');
					return { label: fact, value: id, default: is_enabled };
				});

				return new JsonResponse({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						components: [
							{
								type: MessageComponentTypes.ACTION_ROW,
								components: [
									{
										type: MessageComponentTypes.STRING_SELECT,
										custom_id: 'select_facts',
										placeholder: "Choose which of Ben's facts will make the cut!",
										min_values: 1,
										max_values: facts.length,
										options
									}
								]
							}
						],
						flags: InteractionResponseFlags.EPHEMERAL
					}
				});
			}
			default:
				return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
		}
	} else if (interaction.type === InteractionType.MODAL_SUBMIT) {
		const username = interaction.member.user.username;
		const userAccessResponse = validateUserAccess(username);
		if (userAccessResponse) {
			return userAccessResponse;
		}

		const { custom_id: id, value: fact } = interaction.data.components[0].components[0];
		await storeFact(id, fact);

		return new JsonResponse({
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: 'Fact added! They better hold on to their butts...',
				flags: InteractionResponseFlags.EPHEMERAL
			}
		});
	} else if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
		const username = interaction.member.user.username;
		const userAccessResponse = validateUserAccess(username);
		if (userAccessResponse) {
			return userAccessResponse;
		}

		const factIds = interaction.data.values;
		await updateFactsStatus(factIds);

		return new JsonResponse({
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: "Facts updated! Make 'em squirm",
				flags: InteractionResponseFlags.EPHEMERAL
			}
		});
	}

	console.error('Unknown Type');
	return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
});
router.all('*', () => new Response('Not Found.', { status: 404 }));

async function verifyDiscordRequest(request) {
	const signature = request.headers.get('x-signature-ed25519');
	const timestamp = request.headers.get('x-signature-timestamp');
	const body = await request.text();
	const isValidRequest =
		signature && timestamp && verifyKey(body, signature, timestamp, process.env.DISCORD_PUBLIC_KEY);
	if (!isValidRequest) {
		return { isValid: false };
	}

	return { interaction: JSON.parse(body), isValid: true };
}

// create a @whatwg-node/server
const ittyServer = createServerAdapter((request, env, ctx) => {
	return router.handle(request, env, ctx).catch(error);
});

const httpServer = createServer(ittyServer);
httpServer.listen(process.env.PORT ?? 8787);
console.log('bot server started');
