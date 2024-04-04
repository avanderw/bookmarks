import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		host: true,
		watch: {
			usePolling: true // required for WSL/docker windows filesystem mount, CPU heavy
		}
	},
	plugins: [sveltekit()]
});
