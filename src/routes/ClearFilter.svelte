<script>
    import { tagFilter, domainFilter } from '$lib/stores';

    function clear() {
        $tagFilter = '';
        $domainFilter = '';
    }
</script>

{#if $tagFilter || $domainFilter}
    <button  on:click={clear}>Clear filter</button>    
{/if}
