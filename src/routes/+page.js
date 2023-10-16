import { db, factsTable } from '$lib/db';
import OpenAI from 'openai';

export const csr = false;

const openai = new OpenAI();

const MAX_GENERATED_FACTS = Number(process.env.MAX_GENERATED_FACTS ?? 200);

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
	let fact = await db.query.facts.findFirst({
		where: {
			is_enabled: true,
			from_ben: Math.random() < 0.75
		}
	});
	if (fact == null) {
		fact = await db.query.facts.findFirst({
			where: {
				is_enabled: true,
				from_ben: false
			}
		});
	}

	return fact;
}
