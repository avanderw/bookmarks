<script>
// @ts-nocheck

	export let bookmark;

    import { bookmarks } from '$lib/stores';

    function remove() {
        $bookmarks = $bookmarks.filter((b) => b !== bookmark);
    }
</script>

<form on:submit={remove}>
	<button>remove-bm</button>
</form>
