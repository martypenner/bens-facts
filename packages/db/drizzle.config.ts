import type { Config } from 'drizzle-kit';

export default {
	schema: './schema.ts',
	out: './migrations',
	driver: 'pg',
} satisfies Config;
