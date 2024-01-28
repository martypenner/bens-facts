import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { RDS } from 'sst/node/rds';
import { factsTable } from './schema';

export * from './schema';

// Given the nature of lambdas, we have to "thunk" our db so it doesn't try to build
// in every situation. We have to wait for the server to grab it, or else we get
// "cannot bind rds.db" errors.
let db;
export const getDb = () => {
	if (db) return db;

	db = drizzle(
		new RDSDataClient({
			region: 'us-east-1',
		}),
		{
			database: RDS.db.defaultDatabaseName,
			secretArn: RDS.db.secretArn,
			resourceArn: RDS.db.clusterArn,
			schema: {
				facts: factsTable,
			},
		}
	);
	return db;
};
