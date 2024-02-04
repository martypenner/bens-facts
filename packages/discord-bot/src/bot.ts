/**
 * The core discord bot server.
 */

import { getFacts, storeFact, updateFactsStatus } from '@bens-facts/core';
import {
	InteractionResponseFlags,
	InteractionResponseType,
	InteractionType,
	MessageComponentTypes,
	TextStyleTypes,
	verifyKey,
} from 'discord-interactions';
import dotenv from 'dotenv';
import { Context, Hono } from 'hono';
import { logger } from 'hono/logger';
import { nanoid } from 'nanoid';
import { ADD_COMMAND, SELECT_COMMAND } from './commands.js';

dotenv.config({ path: '.dev.vars' });

type Variables = {
	interaction: InteractionType;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
export default app;

app.use('*', logger());
app.use('*', async (c, next) => {
	const { isValid, interaction } = await verifyDiscordRequest(c);
	if (!isValid || !interaction) {
		return c.text('Bad request signature.', 401);
	}
	c.set('interaction', interaction);
	await next();
});

/**
 * Main route for all requests sent from Discord. All incoming messages will
 * include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
app.post('/', async (c) => {
	const interaction = c.get('interaction');

	if (interaction.type === InteractionType.PING) {
		// The `PING` message is used during the initial webhook handshake, and is
		// required to configure the webhook in the developer portal.
		return c.json({
			type: InteractionResponseType.PONG,
		});
	}

	if (interaction.type === InteractionType.APPLICATION_COMMAND) {
		const username = interaction.member.user.username;
		const userAccessResponse = validateUserAccess(username);
		if (userAccessResponse) {
			return c.json(userAccessResponse.error, userAccessResponse.statusCode);
		}

		// Most user commands will come as `APPLICATION_COMMAND`.
		switch (interaction.data.name.toLowerCase()) {
			case ADD_COMMAND.name.toLowerCase(): {
				return c.json({
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
										custom_id: nanoid(),
										style: TextStyleTypes.PARAGRAPH,
										label: "A cool Ben's Fact",
										min_length: 1,
										max_length: 1000,
										required: true,
									},
								],
							},
						],
					},
				});
			}
			case SELECT_COMMAND.name.toLowerCase(): {
				// Chunk facts into multiple selects
				// TODO: maybe multiple messages as well?
				const CHUNK_SIZE = 5;
				const allFacts = await getFacts(c.env);
				const options = allFacts
					.map(({ id, fact, is_enabled }) => {
						fact = fact.substring(0, 97).concat('...');
						return { label: fact, value: id, default: is_enabled };
					})
					.reduce((allFacts, fact, index) => {
						const chunkIndex = Math.floor(index / CHUNK_SIZE);
						allFacts[chunkIndex] ??= [];
						allFacts[chunkIndex].push(fact);
						return allFacts;
					}, []);

				// TODO: this doesn't actually work since we wipe out other settings
				// when we receive the request with the list of enabled facts
				const components = options.map((options, index) => {
					return c.json({
						type: MessageComponentTypes.ACTION_ROW,
						components: [
							{
								type: MessageComponentTypes.STRING_SELECT,
								custom_id: `select_facts_${index + 1}`,
								placeholder: "Choose which of Ben's facts will make the cut!",
								min_values: 0,
								max_values: options.length,
								options,
							},
						],
					});
				});

				return c.json({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						components,
						flags: InteractionResponseFlags.EPHEMERAL,
					},
				});
			}
			default:
				return c.json({
					statusCody: 400,
					body: { error: 'Unknown Type' },
				});
		}
	} else if (interaction.type === InteractionType.MODAL_SUBMIT) {
		const username = interaction.member.user.username;
		const userAccessResponse = validateUserAccess(username);
		if (userAccessResponse) {
			return c.json(userAccessResponse.error, userAccessResponse.statusCode);
		}

		const { value: fact } = interaction.data.components[0].components[0];
		await storeFact(c.env, fact);

		return c.json({
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: 'Fact added! They better hold on to their butts...',
				flags: InteractionResponseFlags.EPHEMERAL,
			},
		});
	} else if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
		const username = interaction.member.user.username;
		const userAccessResponse = validateUserAccess(username);
		if (userAccessResponse) {
			return c.json(userAccessResponse.error, userAccessResponse.statusCode);
		}

		const factIds = interaction.data.values;
		await updateFactsStatus(c.env, factIds);

		return c.json({
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: "Facts updated! Make 'em squirm",
				flags: InteractionResponseFlags.EPHEMERAL,
			},
		});
	}

	console.error('Unknown Type');
	return c.text('Unknown Type', 400);
});

async function verifyDiscordRequest(c: Context) {
	const request = c.req;
	const signature = request.header('x-signature-ed25519');
	const timestamp = request.header('x-signature-timestamp');
	const body = await request.text();
	const isValidRequest =
		signature && timestamp && verifyKey(body, signature, timestamp, c.env.DISCORD_PUBLIC_KEY);
	if (!isValidRequest) {
		return { isValid: false };
	}

	return { interaction: JSON.parse(body), isValid: true };
}

function validateUserAccess(username: string) {
	if (!['LuggageMoose', 'encryptoknight'].includes(username)) {
		console.error('Invalid user access');
		return {
			statusCode: 403,
			error: 'Invalid user access',
		};
	}
}
