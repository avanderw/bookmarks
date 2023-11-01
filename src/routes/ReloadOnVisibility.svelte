<script>
	import { onMount, onDestroy } from 'svelte';
	import { appData, loadFromLocalStorage } from '$lib/bookmarks';
	import { browser } from '$app/environment';

	const handleVisibilityChange = () => {
		if (document.visibilityState === 'visible') {
            console.log('Visibility restored')
			$appData = loadFromLocalStorage();
		}
	};

	onMount(() => {
		document.addEventListener('visibilitychange', handleVisibilityChange);
	});

	onDestroy(() => {
		if (browser) document.removeEventListener('visibilitychange', handleVisibilityChange);
	});
</script>
