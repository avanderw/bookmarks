<script>
	// @ts-nocheck

	import { bookmarks } from '$lib/stores';

	function exportBookmarks() {
        const bms = JSON.stringify($bookmarks);
		const blob = new Blob([bms], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'bookmarks.json';
		a.click();
	}
</script>

<button on:click={exportBookmarks}><i class="bi bi-box-arrow-up" /></button>
