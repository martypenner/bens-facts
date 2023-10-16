import { db, factsTable } from '$lib/db';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

export const csr = false;

const openai = new OpenAI();

const MAX_GENERATED_FACTS = Number(process.env.MAX_GENERATED_FACTS ?? 200);
const BEN_FACT_WEIGHT = Number(process.env.BEN_FACT_WEIGHT ?? 0.75);

/** @type {import('./$types').PageLoad} */
export async function load() {
	const numFacts = (await db.query.facts.findMany()).length;

	if (numFacts >= MAX_GENERATED_FACTS) {
		try {
			const fact = await getRandomFactWeightedForBen();
			return {
				fact
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
		await db.insert(factsTable).values({
			fact,
			is_enabled: true,
			from_ben: false
		});
	} catch (error) {
		console.error('Error storing fact:', fact, error);
	}

	return {
		fact
	};
}

async function getRandomFactWeightedForBen() {
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
