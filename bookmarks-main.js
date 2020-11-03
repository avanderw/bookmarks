const idList = [];

function sanitize(str) {
    const sanitized = str.replace(/^[^a-z]+|[^\w:.-]+/gi, "");
    if (idList.find(id => id === sanitized) !== undefined) {
        const status = document.getElementById("status");
        status.style.visibility = 'visible';
        status.innerHTML += 'Duplicate IDs found for ' + sanitized + '<br/>';
    }
    idList.push(sanitized);
    return sanitized;
}

function createLink(link) {
    let a = document.createElement("a");
    a.id = link.id;
    a.title = link.title;
    a.innerHTML = ' [ ' + ('' + link.clicks).lpad("&nbsp;", 3) + ' ] ' + link.title;
    a.href = link.link;
    a.onclick = onClick;
    a.target = "_blank";
    return a;
}

function clearTracking() {
    for (let link of bookmarks.links) {
        let id = link.title.replace(/^[^a-z]+|[^\w:.-]+/gi, "");
        if (typeof (Storage) !== 'undefined') {
            localStorage.setItem(id, '0');
        }
    }

    localStorage.setItem("last-clear", new Date().toISOString());
    window.setTimeout(() => location.reload(), 0);
}

function onClick(e) {
    if (typeof (Storage) !== 'undefined') {
        let clicks = 0;
        if (localStorage.getItem(e.target.id) !== null) {
            clicks = parseInt(localStorage.getItem(e.target.id));
        }

        localStorage.setItem(e.target.id, "" + (clicks + 1));
    }
    window.setTimeout(() => location.reload(), 0);
}

function createList(links) {
    let ul = document.createElement("ul");
    for (let link of links) {
        link.id = sanitize(link.title);
        if (typeof (Storage) !== 'undefined') {
            if (localStorage.getItem(link.id) !== null) {
                link.clicks = parseInt(localStorage.getItem(link.id));
            } else {
                link.clicks = 0;
            }
        }
    }

    links.sort((a, b) => {
        return b.clicks - a.clicks;
    });
    for (let link of links) {
        let li = document.createElement("li");
        li.appendChild(createLink(link));
        ul.appendChild(li);
    }
    return ul;
}

String.prototype.lpad = function (padString, length) {
    let str = this;
    while (str.length < length)
        str = padString + str;
    return str;
}

function init() {
    document.getElementById("main").appendChild(createList(bookmarks.links));

    for (let group of bookmarks.groups) {
        let h = document.createElement("h1");
        h.innerHTML = group.title;

        let div = document.createElement("div");
        div.appendChild(h)
        div.appendChild(createList(group.links));
        document.getElementById("main").appendChild(div);
    }

    if (localStorage.getItem("last-clear") == null) {
        localStorage.setItem("last-clear", new Date().toISOString());
    }
    const lastClear = localStorage.getItem("last-clear").replace(/(.*)T.*/, "$1");
    document.getElementById("info").innerText = "Last cleared: " + lastClear;
}
