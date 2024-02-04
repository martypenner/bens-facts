import { integer, text, sqliteTable } from 'drizzle-orm/sqlite-core';

export const factsTable = sqliteTable('facts', {
	id: integer('id').unique().primaryKey(),
	fact: text('fact').notNull(),
	from_ben: integer('from_ben', { mode: 'boolean' }).notNull().default(true),
	is_enabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
});

export type Fact = typeof factsTable.$inferSelect; // return type when queried
