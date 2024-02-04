import { drizzle } from 'drizzle-orm/d1';
import { factsTable } from './schema';

export * from './schema';
export * from './facts';

export function getDbClient(env: Env) {
	const db = drizzle(env.factsDb, {
		schema: {
			facts: factsTable,
		},
	});
	return db;
}
