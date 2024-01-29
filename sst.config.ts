import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { RemovalPolicy } from 'aws-cdk-lib/core';
import type { SSTConfig } from 'sst';
import { Api, Config, RDS, Script, SvelteKitSite } from 'sst/constructs';

export default {
	config(_input) {
		return {
			name: 'ben-facts',
			region: 'us-east-1',
		};
	},
	stacks(app) {
		app.stack(function Site({ stack }) {
			const MIGRATIONS_DIR = 'migrations';

			const OPENAI_API_KEY = new Config.Secret(stack, 'OPENAI_API_KEY');
			const DISCORD_APPLICATION_ID = new Config.Secret(stack, 'DISCORD_APPLICATION_ID');
			const DISCORD_PUBLIC_KEY = new Config.Secret(stack, 'DISCORD_PUBLIC_KEY');
			const DISCORD_TOKEN = new Config.Secret(stack, 'DISCORD_TOKEN');

			const MAX_GENERATED_FACTS = new Config.Parameter(stack, 'MAX_GENERATED_FACTS', {
				value: '200',
			});
			const BEN_FACT_WEIGHT = new Config.Parameter(stack, 'BEN_FACT_WEIGHT', {
				value: '0.75',
			});

			const certificate = new Certificate(this, 'Certificate', {
				domainName: '*.benfacts.ca',
				subjectAlternativeNames: ['benfacts.ca'],
				validation: CertificateValidation.fromDns(),
			});
			if (stack.stage === 'prod') {
				certificate.applyRemovalPolicy(RemovalPolicy.RETAIN);
			}

			const db = new RDS(stack, 'db', {
				engine: 'postgresql13.9',
				defaultDatabaseName: 'facts',
			});

			new Script(stack, 'db-migrator', {
				defaults: {
					function: {
						bind: [db],
						environment: {
							MIGRATIONS_DIR,
						},
						copyFiles: [
							{
								from: 'packages/db/migrations',
								to: MIGRATIONS_DIR,
							},
						],
					},
				},
				onCreate: 'packages/db/migrate.handler',
				onUpdate: 'packages/db/migrate.handler',
			});

			new Script(stack, 'discord-bot-register', {
				defaults: {
					function: {
						bind: [DISCORD_APPLICATION_ID, DISCORD_TOKEN],
					},
				},
				onUpdate: 'packages/discord-bot/src/register.handler',
			});

			const api = new Api(stack, 'discord-api', {
				routes: {
					'POST /': 'packages/discord-bot/src/bot.handler',
				},
				defaults: {
					function: {
						bind: [db, DISCORD_APPLICATION_ID, DISCORD_PUBLIC_KEY, DISCORD_TOKEN],
					},
				},
				cors: {
					// NOTE: this is already locked down because of our private discord key,
					// which gets verified in our handler.
					allowMethods: ['POST'],
				},
			});

			const site = new SvelteKitSite(stack, 'site', {
				path: 'packages/website',
				customDomain: {
					domainName: 'benfacts.ca',
					isExternalDomain: true,
					cdk: {
						certificate,
					},
				},
				warm: 10,
				bind: [db, MAX_GENERATED_FACTS, BEN_FACT_WEIGHT, OPENAI_API_KEY],
			});

			stack.addOutputs({
				url: site.url,
				apiUrl: api.url,
				dbSecretsArn: db.secretArn,
			});
		});

		// Remove all resources when stages are removed
		app.setDefaultRemovalPolicy('destroy');
	},
} satisfies SSTConfig;
