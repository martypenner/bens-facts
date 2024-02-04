import { migrate } from 'drizzle-orm/d1/migrator';
import process from 'node:process';
import { getDbClient } from './client';

export default <ExportedHandler>{
	async fetch(_, env: Env) {
		const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR ?? './migrations';
		const db = getDbClient(env.factsDb);
		await migrate(db, { migrationsFolder: MIGRATIONS_DIR });

		return new Response('success!');
	},
};
