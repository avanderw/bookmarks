import { writable } from "svelte/store";
import { browser } from "$app/environment";

export interface Bookmark {
    url: string;
    title: string | null;
    description: string | null;
    tags: string[];
    notes: string | null;
    added: Date;
    clicked: number;
    last: Date | null;
    userAgent?: string;
    browser?: string;
    os?: string;
    device?: string;
}

export interface BookmarkStore {
    version: string;
    bookmarks: Bookmark[];
}

interface OldBookmark {
    href: string;
    title: string | null;
    description: string | null;
    tags: string[];
    notes: string | null;
    added: Date;
    clicked: number;
    last: Date | null;
}

export const appData = writable(loadFromLocalStorage());

appData.subscribe((value) => {
    if (browser)
        localStorage.setItem("bookmarks", JSON.stringify(value));
}); // local storage
appData.subscribe((value) => { console.debug("Saving bookmark store\n", value); }); // for debugging
// update filehandle

export function loadFromLocalStorage(): BookmarkStore {
    const version = "2025-08-12"; // Updated to trigger migration for user agent fields
    let data: BookmarkStore | Array<OldBookmark> = { version: version, bookmarks: [] };
    if (browser) {
        console.log("Loading bookmark store from local storage");
        const localStore = localStorage.getItem("bookmarks");

        if (localStore) {
            data = JSON.parse(localStore);

            if (data instanceof Array) {
                console.log("Converting unversioned bookmark store to new format");
                const tmp = data;
                data = { version: version, bookmarks: [] };
                for (const bookmark of tmp) {
                    data.bookmarks.push({
                        url: bookmark.href,
                        title: bookmark.title,
                        description: "",
                        tags: [],
                        notes: "",
                        added: bookmark.added,
                        clicked: bookmark.clicked,
                        last: bookmark.last,
                        userAgent: undefined,
                        browser: undefined,
                        os: undefined,
                        device: undefined
                    });
                }
            }
        }
    }
    return data;
}