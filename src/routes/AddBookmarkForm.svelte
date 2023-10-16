<script>
	import { getUrlParameter } from '$lib/url';
	import { createEventDispatcher } from 'svelte';
	import { appData } from '$lib/bookmarks';

	const dispatch = createEventDispatcher();

	let url = getUrlParameter('h');
	let title = getUrlParameter('t');
	let description = getUrlParameter('d');
	let tags = '';
	let notes = '';

    let errUrl = false;

	function save() {
        if (url === null || url === '') {
            errUrl = true;
            return;
        }
        if (title === '') {
            title = url;
        }
		const data = {
			url,
			title,
			description,
			tags: tags.split(' ').filter((tag) => tag !== ''),
			notes,
            added: new Date(),
            clicked: 0,
		};
		$appData.bookmarks.push(data);
        $appData = $appData;
		close();
	}

	function close() {
		if (getUrlParameter('h') !== null) {
			window.close();
		}
		dispatch('close');
	}
</script>

<form on:submit={save} on:reset={close}>
	<h1><svg><use href="feather-sprite.svg#bookmark" /></svg> New bookmark</h1>
	<label for="url">URL</label>
	<input id="url" type="url" bind:value={url} class:error={errUrl} autofocus/>

	<label for="title">Title (optional)</label>
	<input id="title" type="text" bind:value={title} />

	<label for="description">Description (optional)</label>
	<textarea id="description" bind:value={description} />

	<label for="tags">Tags (optional)</label>
	<input id="tags" type="text" bind:value={tags} />
	<p>
		Enter any number of tags separated by space and without the hash (#).
	</p>

	<label for="notes">Notes (optional)</label>
	<textarea id="notes" bind:value={notes} />
	<p>Additional notes, supports Markdown.</p>

	<div>
		<button type="submit">Save</button>
		<button type="reset">Nevermind</button>
	</div>
</form>

<style>
	h1 {
		font-size: 1.5rem;
		margin: 0;
	}
	label {
		font-size: 0.9rem;
		font-weight: bold;
	}
	input,
	textarea {
		border: 2px solid var(--border);
		border-radius: 0.25rem;
		padding: 0.25rem;
		width: 95%;
		margin: 0 auto;
	}
	input:focus,
	textarea:focus {
		outline: none;
		border: 2px solid var(--input-focus);
	}
	textarea {
		height: 5rem;
	}
	p {
		font-weight: 300;
		font-size: 0.75rem;
		margin: 0;
	}
	form {
		background-color: var(--panel);
		border: 1px solid var(--border);
		padding: 1rem;
		border-radius: 1rem;
		position: fixed;
		top: 50%;
		left: 50%;
		margin: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 320px;
		height: 600px;
		transform: translate(-50%, -50%);
	}
	form > div {
		margin-top: auto;
		display: flex;
		justify-content: space-between;
	}
	form > div > button {
		width: 48%;
	}
	button {
		border: 1px solid var(--button-border);
		border-radius: 0.25rem;
		padding: 0.25rem;
		font-size: 0.9rem;
		font-weight: bold;
	}
	button[type='submit'] {
		background-color: var(--submit-background);
		color: var(--submit-text);
	}
	button[type='submit']:hover {
		background-color: var(--submit-hover);
	}
	button[type='submit']:active {
		background-color: var(--submit-active);
	}
	button[type='reset'] {
		background-color: var(--reset-background);
		color: var(--reset-text);
	}
	button[type='reset']:hover {
		background-color: var(--reset-hover);
	}
	button[type='reset']:active {
		background-color: var(--reset-active);
	}

    @keyframes shake {
        0% {
            transform: translateX(0);
        }
        25% {
            transform: translateX(-0.25rem);
        }
        50% {
            transform: translateX(0);
        }
        75% {
            transform: translateX(0.25rem);
        }
        100% {
            transform: translateX(0);
        }
    }
    .error {
        border-color: var(--error);
        animation: shake 0.2s ease-in-out 0s 2;
    }
</style>
