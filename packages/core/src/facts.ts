import { getDbClient } from './client';
import { factsTable } from './schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

export async function getFacts(env: Env) {
	const db = getDbClient(env);

	try {
		const facts = await db.query.facts.findMany();
		return facts;
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error reading facts:', error);
		}

		throw error;
	}
}

export async function storeFact(env: Env, fact: string, is_enabled = true) {
	const db = getDbClient(env);

	try {
		await db.insert(factsTable).values({
			fact,
			is_enabled,
			from_ben: true,
		});
	} catch (error) {
		const message = 'Error writing facts:';
		console.error(message, error);
		throw new Error(message);
	}
}

export async function updateFactsStatus(env: Env, _factIds: number[]) {
	const _db = getDbClient(env);

	try {
		// await db.insert(factsTable).values({
		// 	fact,
		// 	is_enabled,
		// 	from_ben: true
		// });
	} catch (error) {
		const message = 'Error writing facts:';
		console.error(message, error);
		throw new Error(message);
	}
}

export async function getRandomFact(env: Env) {
	const MAX_GENERATED_FACTS = Number(env.MAX_GENERATED_FACTS ?? 200);

	const db = getDbClient(env);
	const openai = new OpenAI({
		apiKey: env.OPENAI_API_KEY,
	});

	const numFacts = (await db.query.facts.findMany()).length;

	if (numFacts >= MAX_GENERATED_FACTS) {
		try {
			const fact = await getRandomFactWeightedForBen({ env, db });
			return fact;
		} catch (error) {
			console.error(error);
			// let the script continue as usual
		}
	}

	const completion = await openai.chat.completions.create({
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
	const fact = completion.choices[0].message.content;

	try {
		if (fact == null) throw new Error('Fact cannot be null');

		await db.insert(factsTable).values({
			fact,
			is_enabled: true,
			from_ben: false,
		});
	} catch (error) {
		console.error('Error storing fact:', fact, error);
		return 'Whoops! There are no more facts left in the universe. Please wait for the universe to generate some more.';
	}

	return fact;
}

async function getRandomFactWeightedForBen({
	env,
	db,
}: {
	env: Env;
	db: ReturnType<typeof getDbClient>;
}) {
	const BEN_FACT_WEIGHT = Number(env.BEN_FACT_WEIGHT ?? 0.75);

	const facts = await db.select().from(factsTable).where(eq(factsTable.is_enabled, true));
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
