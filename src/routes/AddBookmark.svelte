<script>
	import { bookmarks } from '$lib/stores';

	let url = '';
	let title = '';

	function add() {
		$bookmarks = [
			...$bookmarks,
			{ id: $bookmarks.length, title: title, href: url, added: new Date(), clicked: 0, last: null }
		];
		url = '';
		title = '';
	}
</script>

<form on:submit={add}>
	<input bind:value={url} placeholder="URL" />
	<input bind:value={title} placeholder="Title" />
	<button type="submit"><i class="bi bi-bookmark-plus-fill"></i></button>
</form>
