import { writable } from "svelte/store";
import { browser } from "$app/environment";

export interface Bookmark {
    url: string | null;
    title: string | null;
    description: string | null;
    tags: string[];
    notes: string | null;
}

export interface BookmarkStore {
    bookmarks: Bookmark[];
}

let data: BookmarkStore = { bookmarks: [] };
if (browser) {
    const localStore = localStorage.getItem("bookmarks");

    if (localStore) {
        data = JSON.parse(localStore);
    }
}

export const appData = writable(data);

appData.subscribe((value) => {
    if (browser)
        localStorage.setItem("bookmarks", JSON.stringify(value));
}); // local storage
appData.subscribe((value) => { console.log("updating bookmark store\n", value); }); // for debugging
// update filehandle