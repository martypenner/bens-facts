import { db } from './src/lib/db';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import 'dotenv/config';

await migrate(db, { migrationsFolder: 'drizzle' });
