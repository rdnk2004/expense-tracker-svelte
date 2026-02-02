import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Configure for SPA mode - static site with client-side routing
		adapter: adapter({
			fallback: 'index.html', // SPA fallback for client-side routing
			precompress: false
		})
	}
};

export default config;
