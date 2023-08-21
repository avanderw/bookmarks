<script>
    import { tagFilter } from '$lib/stores';

    function clear() {
        $tagFilter = '';
    }
</script>

{#if $tagFilter}
    <button  on:click={clear}>Clear filter</button>    
{/if}
