<script>
	// @ts-nocheck

	import { filters, bookmarks } from '$lib/stores';

	export let model;
	let filteredList;

	function remove() {
		$filters = $filters.filter((f) => f !== model);
	}

	let isEditingExpr = false;
	function editExpr() {
		if (isEditingExpr) {
			$filters.find((f) => f === model).filter = model.filter;
			$filters = $filters;
			filter();
		}
		isEditingExpr = !isEditingExpr;
	}

	function testTags(b) {
		let tags = model.filter.match(/tags=([^&]+)/)[1].split(',');
		return tags.every((t) => b.tags && b.tags.some((bt) => bt === t));
	}

	function filter() {
		const fn = {
			tags: model.filter && model.filter.indexOf('tags=') > -1,
			title: model.filter && model.filter.indexOf('title=') > -1,
			url: model.filter && model.filter.indexOf('url=') > -1,
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

	let isEditingTitle = false;
	function editTitle() {
		if (isEditingTitle) {
			$filters.find((f) => f === model).name = model.name;
			$filters = $filters;
		}
		isEditingTitle = !isEditingTitle;
	}

	filter();
</script>

<h1>
	<button on:click={remove}><i class="bi bi-trash" /></button>
	<form on:submit={editTitle}>
		{#if isEditingTitle}
			<input type="text" bind:value={model.name} />
		{:else}
			<button type="submit">{model.name}</button>
		{/if}
	</form>

	<form on:submit={editExpr}>
		{#if isEditingExpr}
			<input type="text" bind:value={model.filter} />
		{:else}
			<button type="submit">{model.filter}</button>
		{/if}
	</form>
</h1>

<ol>
	{#each filteredList as bookmark}
		<li>{bookmark.title}</li>
	{/each}
</ol>

