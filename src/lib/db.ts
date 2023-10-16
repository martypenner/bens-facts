import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import { boolean, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const factsTable = pgTable('facts', {
	id: uuid('id').defaultRandom().primaryKey(),
	fact: text('fact').notNull(),
	from_ben: boolean('from_ben').default(true),
	is_enabled: boolean('is_enabled').default(true)
});

export type Fact = typeof factsTable.$inferSelect; // return type when queried

export const db = drizzle(sql, {
	schema: {
		facts: factsTable
	}
});
