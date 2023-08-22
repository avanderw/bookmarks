<script>
	// @ts-nocheck
	import { bookmarks } from '$lib/stores';
	import { friendly } from '$lib/time';
	import AddTag from './AddTag.svelte';
	import SortButton from './SortButton.svelte';
	import AddFilter from './AddFilter.svelte';
	import RemoveBookmark from './RemoveBookmark.svelte';
	import Tag from './Tag.svelte';
	import Domain from './Domain.svelte';
	import BookmarksExport from './BookmarksExport.svelte';
	import BookmarksImport from './BookmarksImport.svelte';

	const score = (b) => {
		const dayDifference = Math.floor((new Date() - new Date(b.last)) / (1000 * 60 * 60 * 24)) || 0;
		return Math.floor((b.clicked * 100) / (dayDifference + 1));
	};

	$bookmarks.sort((a, b) => score(a) - score(b)).reverse();
	let lastSort = 'score';

	function updateClicked(b) {
		b.clicked += 1;
		b.last = new Date();
		if (lastSort === 'score') {
			$bookmarks.sort((a, b) => score(a) - score(b)).reverse();
		}
		$bookmarks = $bookmarks;
	}
</script>

<svelte:head>
	<title>Bookmark manager</title>
</svelte:head>

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

	<BookmarksImport /><BookmarksExport />
	<AddFilter />
</h1>
<ol>
	{#each $bookmarks as bookmark}
		<li>
			<div>
				<a
					href={bookmark.href}
					target="_blank"
					on:click={() => updateClicked(bookmark)}
					on:auxclick={() => updateClicked(bookmark)}>{bookmark.title}</a
				>
				<Domain {bookmark} />
				{#if bookmark.tags}
					{#each bookmark.tags as tag}
						<Tag bookmarkId={bookmark.id} {tag} />
					{/each}
				{/if}
				<AddTag id={Number(bookmark.id)} />
				<RemoveBookmark {bookmark} />
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
{#if !$bookmarks.length}
	<p>Add some bookmarks to get started.</p>
{/if}

<style>
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
</style>
