import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import 'dotenv/config';

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		'process.env.POSTGRES_URL': JSON.stringify(process.env.POSTGRES_URL),
		'process.env.MAX_GENERATED_FACTS': JSON.stringify(process.env.MAX_GENERATED_FACTS)
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
