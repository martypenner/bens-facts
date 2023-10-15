import { kv } from '@vercel/kv';
import OpenAI from 'openai';
import { ulid } from 'ulid';

export const csr = false;

const openai = new OpenAI();

const MAX_GENERATED_FACTS = 200;

/** @type {import('./$types').PageLoad} */
export async function load() {
	// - (later) return only ones that this cookie hasn't seen before

	const facts = (await kv.scan(0, { match: 'fact:*' }))[1];
	const numFacts = facts.length;
	if (numFacts >= MAX_GENERATED_FACTS) {
		const { fact } = await getRandomFact(facts);
		return {
			fact
		};
	}

	let completion = await openai.chat.completions.create({
		messages: [
			{
				role: 'assistant',
				content:
					'You are Ben. You produce mundane and silly facts in the style of the Red Green show. You never produce more than one fact at a time, and never include a preamble. Your aim is to be comedic withiut being silly. Answer only with a silly fact.'
			},
			{
				role: 'user',
				content: 'give me a ben fact'
			}
		],
		model: 'gpt-4'
	});
	let fact = completion.choices[0].message.content;

	try {
		const id = ulid();
		const factObj = {
			id,
			fact,
			is_enabled: true
		};
		console.log('Fact being persisted:', factObj);

		// Store the fact
		await kv.hset(`fact:${id}`, factObj);
	} catch (error) {
		console.error('Error storing fact:', fact, error);
	}

	return {
		fact
	};
}

async function getRandomFact(facts) {
	let randomFactId;
	let fact;

	do {
		randomFactId = facts[Math.floor(Math.random() * facts.length)];
		fact = await kv.hgetall(randomFactId);
	} while (!fact?.is_enabled);

	return fact;
}
