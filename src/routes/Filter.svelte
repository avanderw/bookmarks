<script>
	// @ts-nocheck

	import { filters, bookmarks } from '$lib/stores';

	export let model;
	let expr = model.filter;
	let filteredList;

	function remove() {
		$filters = $filters.filter((f) => f !== model);
	}

	function update() {
		$filters.find((f) => f === model).filter = expr;
		$filters = $filters;
		filter();
	}

	function testTags(b) {
		let tags = expr.match(/tags=([^&]+)/)[1].split(',');
		return tags.every((t) => b.tags && b.tags.some((bt) => bt === t));
	}

	function filter() {
		const fn = {
			tags: expr && expr.indexOf('tags=') > -1,
			title: expr && expr.indexOf('title=') > -1,
			url: expr && expr.indexOf('url=') > -1,
			test: function (b) {
				return (
					(this.tags ? testTags(b) : true) &&
					(this.title ? testTitle(b) : true) &&
					(this.url ? testUrl(b) : true)
				);
			}
		};
		filteredList = $bookmarks.filter((b) => fn.test(b));
	}

	filter();
</script>

<h1>
	<button on:click={remove}>x</button>
	{filter.name}
	{#if filter.filter}
		{#each filter.filter as f}
			<span>{f}</span>
		{/each}
	{:else}
		<form on:submit={update}>
			<input type="text" bind:value={expr} />
		</form>
	{/if}
</h1>

<ol>
	{#each filteredList as bookmark}
		<li>{bookmark.title}</li>
	{/each}
</ol>

<style>
	form {
		display: inline;
	}
</style>
