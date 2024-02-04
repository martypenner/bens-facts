interface Env {
	OPENAI_API_KEY?: string;
	BEN_FACT_WEIGHT?: string;
	MAX_GENERATED_FACTS?: string;
	factsDb: D1Database;
	[key: string]: unknown;
}
