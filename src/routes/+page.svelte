<script>
	import { getUrlParameter } from '$lib/url';
	import Bookmarklet from './Bookmarklet.svelte';
	import AddBookmarkForm from './AddBookmarkForm.svelte';
	import DebugStore from './DebugStore.svelte';

	let state = 'default';

	if (getUrlParameter('h') !== null) {
		state = 'add';
	}
</script>

<button on:click={()=>state='add'}><svg><use href="feather-sprite.svg#plus-square" /></svg></button>
<Bookmarklet />
{#if state === 'add'}
	<AddBookmarkForm on:close={() => (state = 'default')} />
{/if}
<DebugStore />
