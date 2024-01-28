import { factsTable, getDb } from '@ben-facts/db';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { Config } from 'sst/node/config';

export const csr = false;

/** @type {import('./$types').PageLoad} */
export async function load() {
	const openai = new OpenAI({
		apiKey: Config.OPENAI_API_KEY,
	});
	const MAX_GENERATED_FACTS = Number(Config.MAX_GENERATED_FACTS);

	const db = getDb();
	const numFacts = (await db.query.facts.findMany()).length;

	if (numFacts >= MAX_GENERATED_FACTS) {
		try {
			const fact = await getRandomFactWeightedForBen();
			return {
				fact,
			};
		} catch (error) {
			console.error(error);
			// let the script continue as usual
		}
	}

	let completion = await openai.chat.completions.create({
		messages: [
			{
				role: 'assistant',
				content:
					'You are Ben. You produce mundane and silly facts in the style of the Red Green show. You never produce more than one fact at a time, and never include a preamble. Your aim is to be comedic withiut being silly. Answer only with a silly fact.',
			},
			{
				role: 'user',
				content: 'give me a ben fact',
			},
		],
		model: 'gpt-4-0125-preview',
	});
	let fact = completion.choices[0].message.content;

	try {
		if (fact == null) throw new Error('Fact cannot be null');

		await db.insert(factsTable).values({
			fact,
			is_enabled: true,
			from_ben: false,
		});
	} catch (error) {
		console.error('Error storing fact:', fact, error);
	}

	return {
		fact,
	};
}

async function getRandomFactWeightedForBen() {
	const BEN_FACT_WEIGHT = Number(Config.BEN_FACT_WEIGHT);
	const db = getDb();

	let facts = await db.select().from(factsTable).where(eq(factsTable.is_enabled, true)).limit(10);
	let fact = facts[Math.floor(Math.random() * facts.length)];

	if (Math.random() < BEN_FACT_WEIGHT && !fact.from_ben) {
		for (const otherFact of facts) {
			if (otherFact.from_ben) {
				fact = otherFact;
				break;
			}
		}
	}

	return fact?.fact;
}
