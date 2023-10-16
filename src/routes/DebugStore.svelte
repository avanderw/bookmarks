<script lang="ts">
	import { appData } from '$lib/bookmarks';
</script>

<h1>Debug store</h1>
<pre>{JSON.stringify($appData, null, 2)}</pre>

