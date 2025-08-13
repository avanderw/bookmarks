import { browser } from "$app/environment";
import { writable, readonly } from "svelte/store";
import type { CacheStore } from "$lib/index";
import { isValidUrl } from "$lib/url";
import type { Bookmark } from "$lib/bookmarks";

const CACHE_NAME = "bookmarks/cache-store"

function hashFn(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

const fileSystem = {
    handle: null as FileSystemFileHandle | null,
    cache: {
        file: null as File | null,
        hash: null as string | null,
    }
}

function getLocalStorage(): CacheStore {
    const version = "2023-10-16";
    let data: CacheStore = { version: version, bookmarks: [] };
    if (browser) {
        console.log("Loading bookmark store from local storage");
        const localStore = localStorage.getItem(CACHE_NAME);

        if (localStore) {
            data = JSON.parse(localStore);
        }
    }
    return data;
}

const sync = writable({ available: browser && 'showOpenFilePicker' in window, running: false, changes: false })
export const syncStatus = readonly(sync);

let cacheHash: string;
let cacheObject: object;
export const cacheStore = writable(getLocalStorage());
cacheStore.subscribe((value) => {
    console.log("Updating cache store", value);
    if (value) {
        cacheObject = value;
        const json = JSON.stringify(cacheObject);
        cacheHash = hashFn(json);
        if (browser) {
            localStorage.setItem(CACHE_NAME, json);
        }
        if (fileSystem.handle && fileSystem.cache.hash !== cacheHash) {
            sync.set({ available: true, running: true, changes: true });
        }
    }
});

async function watchFileSystem() {
    console.log("watchFileSystem");
    if (!fileSystem.handle || !fileSystem.cache.file) { // not initialized
        return;
    }

    const updateFile = await fileSystem.handle.getFile();
    if (updateFile.lastModified === fileSystem.cache.file.lastModified) { // no change, don't read file
        setTimeout(watchFileSystem, 1000);
        return;
    }
    fileSystem.cache.file = updateFile; // otherwise, update cached file reference

    const updateContent = await updateFile.text();
    const updateHash = hashFn(updateContent);
    if (updateHash === fileSystem.cache.hash) { // modified, same as current
        watchFileSystem();
        return;
    }
    fileSystem.cache.hash = updateHash; // otherwise, update hash

    if (updateHash === cacheHash) { // different from current, same as staging    
        watchFileSystem();
        return;
    }

    // different from current and staging
    if (confirm("File change detected, do you want to update?")) {
        if (confirm("Do you want to save your changes?")) {
            downloadCache();
        }
        cacheStore.set(JSON.parse(updateContent));
    }

    setTimeout(watchFileSystem, 1000);
}

export function downloadCache() {
    let a = document.createElement('a');
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(cacheObject, null, 2));
    a.download = `bookmarks-${new Date().toISOString().split('T')[0]}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


export async function syncFile(handle: FileSystemFileHandle) {
    fileSystem.handle = handle;
    fileSystem.cache.file = await fileSystem.handle.getFile();
    const text = await fileSystem.cache.file.text();
    fileSystem.cache.hash = hashFn(text);
    cacheStore.set(JSON.parse(text));
    watchFileSystem();
    sync.set({ available: true, running: true, changes: false });
}

export async function unsyncFile() {
    fileSystem.handle = null;
    fileSystem.cache.file = null;
    fileSystem.cache.hash = null;
    sync.set({ available: true, running: false, changes: false });
}

export async function readFile(file: File) {
    const data = JSON.parse(await file.text());
    
    // Filter out bookmarks with invalid URLs
    if (data && data.bookmarks && Array.isArray(data.bookmarks)) {
        const originalCount = data.bookmarks.length;
        data.bookmarks = data.bookmarks.filter((bookmark: Bookmark) => {
            return bookmark && bookmark.url && isValidUrl(bookmark.url);
        });
        
        const filteredCount = data.bookmarks.length;
        const removedCount = originalCount - filteredCount;
        
        if (removedCount > 0) {
            console.log(`Filtered out ${removedCount} bookmark(s) with invalid URLs during import`);
            // Show a notification to the user about filtered bookmarks
            if (browser && window.alert) {
                window.alert(`Import complete. ${removedCount} bookmark(s) with invalid URLs were removed.`);
            }
        }
    }
    
    cacheStore.set(data);
    return data;
}

export async function saveCache() {
    if (fileSystem.handle) {
        const writable = await fileSystem.handle.createWritable();
        const json = JSON.stringify(cacheObject, null, 2);
        await writable.write(json);
        await writable.close();
        fileSystem.cache.file = await fileSystem.handle.getFile();
        fileSystem.cache.hash = hashFn(json);
        sync.set({ available: true, running: true, changes: false });
    }
}

export function refreshFromCache() {
    if (document.visibilityState === 'visible') {
        console.log("View restored, refreshing from cache.");
        cacheStore.set(getLocalStorage());
    }
};