function updateMeta(e) {
    const id = e.id;
    const meta = JSON.parse(localStorage.getItem(id)) || {"clicks":0,"last":"never"};
    meta.clicks += 1;
    meta.last = new Date().toISOString();
    localStorage.setItem(id, JSON.stringify(meta))
    window.setTimeout(() => location.reload(), 0);
}

function score(item) {
    const id = md5(item.title);
    const meta = JSON.parse(localStorage.getItem(id)) || {"clicks":0,"last":"never"};
    const dayDifference = Math.floor((new Date() - new Date(meta.last)) / (1000 * 60 * 60 * 24)) || 0;
    return Math.floor(meta.clicks * 100 / (dayDifference + 1));
}

function domain(url) {
    return url.replace(/^https?:\/\/([^\/]+).*$/, "$1");
}

const BOOKMARK_TEMPLATE =
  "<li><a id='${id}' href='${url}' onclick='updateMeta(this)' target='_blank'>${title} <span>(${domain})</span></a><div>Score: ${score} | Last used: ${last}</div></li>";

let data = BOOKMARK_DATA;
data.sort((a, b) => {
    return score(b) - score(a);
});

let html = ``;
for (const item of data) {
    let id = md5(item.title);
    const meta = JSON.parse(localStorage.getItem(id)) || {"clicks":0,"last":"never"};

    html += `${BOOKMARK_TEMPLATE
        .replace(/\$\{id\}/g, id)
        .replace(/\$\{url\}/g, item.url)
        .replace(/\$\{domain\}/g, domain(item.url))
        .replace(/\$\{title\}/g, item.title)
        .replace(/\$\{score\}/g, score(item))
        .replace(/\$\{last\}/g, meta.last.replace(/T.*$/,""))}`;
}
document.getElementById("bookmarks").innerHTML = html;

if (localStorage.getItem("last-clear") === null) {
    localStorage.setItem("last-clear", new Date().toISOString());
}
document.getElementById("footer").innerHTML = `Last cleared: ${localStorage.getItem("last-clear").replace(/T.*$/,"")}`;

const encodedParams = new URLSearchParams();
encodedParams.append("my-url", "https://xkcd.com/info.0.json");

const options = {
	method: 'POST',
	headers: {
		'content-type': 'application/x-www-form-urlencoded',
		'X-RapidAPI-Key': 'df0a095253msh55f9dda5b8227efp1936b0jsn3622477a6bbd',
		'X-RapidAPI-Host': 'cors-proxy3.p.rapidapi.com'
	},
	body: encodedParams
};

fetch('https://cors-proxy3.p.rapidapi.com/api', options)
	.then(response => response.json())
	.then(response => {
		document.getElementById("comic").src = response.img;
		document.getElementById("comic").alt = response.alt;
		document.getElementById("comic-desc").innerText = response.alt;
	})
	.catch(err => console.error(err));
