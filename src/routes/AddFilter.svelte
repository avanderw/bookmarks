<script>
    import { filters } from '$lib/stores';

    function addFilter() {
        $filters = [...$filters, {name: 'test', filter: undefined}];
	}
</script>

<form on:submit={addFilter}>
    <button>filter</button>
</form>