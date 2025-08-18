import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['tests/**/*.{test,spec}.{js,ts}'],
		exclude: ['node_modules', 'build', '.svelte-kit'],
		setupFiles: ['tests/setup.ts']
	},
	resolve: {
		alias: {
			$lib: new URL('./src/lib', import.meta.url).pathname,
			'$app/environment': new URL('./tests/mocks/app-environment.ts', import.meta.url).pathname
		}
	}
});
