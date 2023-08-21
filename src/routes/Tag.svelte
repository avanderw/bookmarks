<script>
// @ts-nocheck

    import { bookmarks, tagFilter } from '$lib/stores';

    export let bookmarkId;
    export let tag;

    function toggle() {
        if ($tagFilter === tag) {
            $bookmarks.find((b) => b.id === bookmarkId).tags = $bookmarks.find((b) => b.id === bookmarkId).tags.filter((t) => t !== tag);
            $bookmarks = $bookmarks;
        } else {
            $tagFilter = tag;
        }
    }
</script>

<button on:click={toggle} class:selected={$tagFilter === tag}>{tag}</button>

<style>
    .selected {
        background-color: #ccc;
        font-weight: bold;
    }
    button {
        border: solid 1px #ccc;
        border-radius: 25%;
        margin: 0 0.25em;
        padding: 0 0.25em;
    }
</style>