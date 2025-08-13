<script lang="ts">
	import { BookmarkManager } from '$lib/component/BookmarkManager';
	import { browser } from '$app/environment';

	// Theme switcher
	function toggleTheme() {
		if (browser) {
			const html = document.documentElement;
			const currentTheme = html.getAttribute('data-theme');
			const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
			html.setAttribute('data-theme', newTheme);
			localStorage.setItem('theme', newTheme);
		}
	}

	// Initialize theme from localStorage or system preference
	if (browser) {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme) {
			document.documentElement.setAttribute('data-theme', savedTheme);
		}
	}
</script>

<svelte:head>
	<title>Bookmarks</title>
</svelte:head>

<BookmarkManager />

<nav>
	<ul>
		<li><a href="https://avanderw.co.za"><svg><use href="feather-sprite.svg#home" /></svg>My homepage</a></li>
		<li><a href="https://github.com/avanderw/bookmarks">
			<svg><use href="feather-sprite.svg#github" /></svg>
			Repo
		</a></li>
		<li><a href="#"><svg><use href="feather-sprite.svg#help-circle" /></svg>Help</a></li>
		<li><a href="https://tracking.avanderw.co.za/avanderw.co.za">
			<svg><use href="feather-sprite.svg#bar-chart-2" /></svg>
			Analytics
		</a></li>
		<li>
			<button class="secondary btn-compact" on:click={toggleTheme} title="Toggle theme">
				<svg><use href="feather-sprite.svg#sun" /></svg>
				Theme
			</button>
		</li>
	</ul>
</nav>


<style>
	nav ul {
		justify-content: center;
		margin: 1rem 0;
	}
	
	nav a {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
	}
	
	nav a:hover {
		text-decoration: underline;
	}

	nav button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
	}
</style>
