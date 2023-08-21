import { writable } from "svelte/store";
import { browser } from "$app/environment";

let bookmarkStore = [];
let filterStore = [];
if (browser) {
    const bookmarkString = localStorage.getItem("bookmarks");

    if (bookmarkString) {
        bookmarkStore = JSON.parse(bookmarkString);
    }

    const filterString = localStorage.getItem("filters");
    if (filterString) {
        filterStore = JSON.parse(filterString);
    }
}

export const bookmarks = writable(bookmarkStore);
export const filters = writable(filterStore);

if (browser) {
    bookmarks.subscribe((value) => { localStorage.setItem("bookmarks", JSON.stringify(value)); });
    filters.subscribe((value) => { localStorage.setItem("filters", JSON.stringify(value)); });
}

export const tagFilter = writable("");
export const domainFilter = writable("");
