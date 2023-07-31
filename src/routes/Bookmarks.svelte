<svelte:head>
    <title>Bookmark manager</title> 
</svelte:head>

<script>
	// @ts-nocheck
	import { bookmarks } from '$lib/stores';
	import { friendly } from '$lib/time';
	import AddTag from './AddTag.svelte';
	import SortButton from './SortButton.svelte';

	const score = (b) => {
		const dayDifference = Math.floor((new Date() - new Date(b.last)) / (1000 * 60 * 60 * 24)) || 0;
		return Math.floor(b.clicked * 100 / (dayDifference + 1));
	}

	$bookmarks.sort((a, b) => score(a) - score(b)).reverse();
	let lastSort = 'score';

	function domain(url) {
		return url.replace(/^https?:\/\/([^\/]+).*$/, '$1');
	}

	function updateClicked(b) {
		b.clicked += 1;
		b.last = new Date();
		$bookmarks = $bookmarks;
	}
</script>

<h1>
	Bookmarks
	<SortButton
		bind:list={$bookmarks}
		field="alpha"
		initDesc={false}
		on:sort={() => (lastSort = 'alpha')}
		active={lastSort === 'alpha'}
	/>
	<SortButton
		bind:list={$bookmarks}
		field="score"
		func={score}
		on:sort={() => (lastSort = 'score')}
		active={lastSort === 'score'}
	/>
	<SortButton
		bind:list={$bookmarks}
		field="clicked"
		func={(b) => b.clicked}
		on:sort={() => (lastSort = 'clicked')}
		active={lastSort === 'clicked'}
	/>
	<SortButton
		bind:list={$bookmarks}
		field="added"
		func={(b) => Date.parse(b.added)}
		on:sort={() => (lastSort = 'added')}
		active={lastSort === 'added'}
	/>
	<SortButton
		bind:list={$bookmarks}
		field="accessed"
		func={(b) => (b.last ? Date.parse(b.last) : 0)}
		on:sort={() => (lastSort = 'accessed')}
		active={lastSort === 'accessed'}
	/>

	<button>export</button><button>import</button>
</h1>
<ol>
	{#each $bookmarks as bookmark}
		<li>
			<div>
				<a href={bookmark.href} target="_blank" on:click={() => updateClicked(bookmark)}
					>{bookmark.title}</a
				>
				<button>({domain(bookmark.href)})</button>
				{#if bookmark.tags}
					{#each bookmark.tags as tag}
						<button>{tag}</button>
					{/each}
				{/if}
				<AddTag id={Number(bookmark.id)} />
			</div>
			<div>
				<span>{score(bookmark)} points</span>
				<span>used {bookmark.clicked} times</span>
				<span>added {friendly(bookmark.added)}</span>
				<span>last used {friendly(bookmark.last)}</span>
			</div>
		</li>
	{/each}
</ol>

<style>
	h1 {
		font-size: medium;
		background-color: #5e503f;
		color: #eae0d5;
		padding: 0.25em;
	}
	h1 button {
		color: #eae0d5;
		font-weight: normal;
		font-size: smaller;
	}
	span {
		color: slategray;
		font-weight: normal;
		font-size: x-small;
	}
	a {
		color: #22333b;
		font-size: medium;
		text-decoration: none;
	}
	a:hover {
		font-weight: bold;
		text-decoration: none;
	}
	button {
		background: none;
		color: #5e503f;
		border: none;
		padding: 0;
		font: inherit;
		font-size: smaller;
		cursor: pointer;
		outline: inherit;
	}
	button + button::before,
	span + span::before {
		content: '|';
		margin: 0 0.25em;
		padding: 0;
	}
	button:hover {
		font-weight: normal;
		text-decoration: underline;
	}
</style>
