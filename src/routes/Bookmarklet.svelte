<script lang="ts">
	const bookmarklet = () => {
		let url = 'http://localhost:5173/bookmarks/';
		url += '?h=' + encodeURIComponent(location.href);
		url += '&t=' + encodeURIComponent(document.title);
		const meta = document.querySelector('meta[name="description"]');
		if (meta) {
			url += '&d=' + encodeURIComponent(meta.content);
		}
		window.open(url);
	};
</script>

<a href="javascript:({bookmarklet})()">bookmarklet</a>
