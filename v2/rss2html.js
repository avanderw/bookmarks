const HACKER_NEWS_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.ycombinator.com%2Frss';
const RSS_TEMPLATE = "<li><a href='${url}' target='_blank'>${title} <span>(${domain})</span></a></li>";

fetch(HACKER_NEWS_URL)
.then(response => response.json())
.then(data => {
    let html = ``;
    for (const item of data.items) {
        html += `${RSS_TEMPLATE
            .replace(/\$\{url\}/g, item.link)
            .replace(/\$\{title\}/g, item.title)
            .replace(/\$\{domain\}/g, domain(item.link))}`;
    }
    document.getElementById('feed').innerHTML = html;
});