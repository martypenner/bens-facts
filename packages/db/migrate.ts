import { migrate } from 'drizzle-orm/postgres-js/migrator';
import process from 'node:process';
import { getDb } from './client';

export const handler = async () => {
	const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR ?? '';
	const db = getDb();
	await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
};
