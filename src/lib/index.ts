// place files you want to import through the `$lib` alias in this folder.

export interface Bookmark {
    url: string;
    title: string | null;
    description: string | null;
    tags: string[];
    notes: string | null;
    added: Date;
    clicked: number;
    last: Date | null;
}

export interface CacheStore {
    version: string;
    bookmarks: Bookmark[];
}