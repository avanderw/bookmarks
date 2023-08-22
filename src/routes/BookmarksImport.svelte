<script>
	// @ts-nocheck

	import { bookmarks } from "$lib/stores";

    // import bookmarks from a file upload
    function importBookmarks() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = () => {
            // @ts-ignore
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                // @ts-ignore
                const bms = JSON.parse(reader.result);
                
                bms.forEach(b => {
                    b.id = $bookmarks.length;
                    b.clicked = 0;
                    b.added = Date.now();
                    b.last = null;
                });
                $bookmarks = [...$bookmarks, ...bms];
            };
            reader.readAsText(file);
        };
        input.click();
    }
</script>
<button on:click={importBookmarks}><i class="bi bi-box-arrow-in-down"></i></button>