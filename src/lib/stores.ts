import { writable } from "svelte/store";
import { browser } from "$app/environment";

let store = [];
if (browser) {
    const localStore = localStorage.getItem("bookmarks");
    if (localStore) {
        store = JSON.parse(localStore);
    }
}

export const bookmarks = writable(store);

if (browser) {
    bookmarks.subscribe((value) => {
        localStorage.setItem("bookmarks", JSON.stringify(value));
    });
}
