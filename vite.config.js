import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import 'dotenv/config';

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		'import.meta.env.KV_REST_API_TOKEN': JSON.stringify(process.env.KV_REST_API_TOKEN),
		'import.meta.env.KV_REST_API_URL': JSON.stringify(process.env.KV_REST_API_URL)
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
