import { writable } from "svelte/store";
import { browser } from "$app/environment";

export interface Bookmark {
    url: string;
    title: string | null;
    description: string | null;
    tags: string[];
    notes: string | null;
    added: Date;
    clicked: number | null;
    last: Date | null;
}

export interface BookmarkStore {
    version: string;
    bookmarks: Bookmark[];
}

const version = "2023-10-16";
let data: BookmarkStore = { version: version, bookmarks: [] };
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
appData.subscribe((value) => { console.log("Updating bookmark store\n", value); }); // for debugging
// update filehandle