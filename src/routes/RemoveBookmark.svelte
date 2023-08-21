<script>
// @ts-nocheck

	export let bookmark;

    import { bookmarks } from '$lib/stores';

    function remove() {
        $bookmarks = $bookmarks.filter((b) => b !== bookmark);
    }
</script>

<form on:submit={remove}>
	<button><i class="bi bi-bookmark-dash-fill"></button>
</form>
