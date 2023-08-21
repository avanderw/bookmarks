<script>
// @ts-nocheck

    import { domainFilter } from "$lib/stores";

    export let bookmark;
    const domain = bookmark.href.replace(/^https?:\/\/([^\/]+).*$/, '$1');

    function toggle() {
        if ($domainFilter === domain) {
            $domainFilter = '';
        } else {
            $domainFilter = domain;
        }
    }
</script>
<button on:click={toggle} class:selected={$domainFilter == domain}>({domain})</button>
<style>
    .selected {
        background-color: #ccc;
        font-weight: bold;
    }
</style>