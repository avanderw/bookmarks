<script lang="ts">
	let display = false;

	function show() {
		display = true;
	}

	function hide() {
		display = false;
	}
</script>

<a href="https://avanderw.tplinkdns.com:31026">Give Feedback</a>

{#if display}
	<iframe src="https://avanderw.tplinkdns.com:31026" title="Feedback Form" />
	<div style="position:fixed;top:0;left:0;right:0;bottom:0;" on:click={hide} />
{/if}

<style>
	a {
		background-color: var(--feedback-background);
		color: var(--feedback-text);
		position: fixed;
		top: 20rem;
		transform: rotate(-90deg);
		transform-origin: top left;
		text-decoration: none;
		border-top-left-radius: 0.5rem;
		border-top-right-radius: 0.5rem;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
			Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}

	iframe {
		background-color: var(--panel);
		border: 1px solid var(--border);
		border-radius: 1rem;
		position: fixed;
		top: 50%;
		left: 50%;
		margin: auto;
		width: 330px;
		height: 450px;
		transform: translate(-50%, -50%);
		z-index: 1;
	}

	@media (orientation: portrait) {
		a {
			padding: 0.15rem 0.5rem;
			right: -5.8rem;
		}
	}

	@media (orientation: landscape) {
		a {
			padding: 0.5rem;
			right: -5.15rem;
		}
	}
</style>
