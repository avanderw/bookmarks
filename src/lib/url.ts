import { browser } from "$app/environment";
export function getUrlParameter(name: string) {
    if (!browser) return null;
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}