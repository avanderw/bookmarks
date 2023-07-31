<script>
	// @ts-nocheck
	export let list;
	export let field;
	export let func = undefined;
	export let active = false;
	export let initDesc = true;

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	let desc = initDesc;

	function sort() {
		dispatch('sort', {});
		if (func) {
			list.sort((a, b) => func(a) - func(b));
		} else {
			list.sort((a, b) => a.title > b.title ? 1 : (a.title < b.title ? -1 : 0));
		}
		desc = active ? !desc : initDesc;

		if (desc) {
			list.reverse();
		}
		active = true;
		list = list;
	}
</script>

<button on:click={sort} class={desc ? 'desc' : 'asc'} class:active>{field}</button>

<style>
	button {
		color: #eae0d5;
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		font-size: smaller;
		font-weight: normal;
		cursor: pointer;
		outline: inherit;
	}
	button:hover {
		font-weight: normal;
		text-decoration: underline;
	}
	button.active.asc::after {
		content: ' ^';
	}
	button.active.desc::after {
		content: ' v';
	}
</style>
