function folder2Files () {
    const els = document.querySelectorAll("#region-main a[href^='http://moodle.nottingham.ac.uk/']");
    for (const el of els) {
        if (el.querySelector("img") && getFileTypeByIcon(el) === 'folder') {
            showChildFile(el);
        }
    }
}

function showChildFile(el) {
    fetch(el.href, {credentials: "include"})
        .then(response => response.text())
        .then(function(text) {
            let node = document.createElement("html");
            node.innerHTML = text;
            el.parentNode.appendChild(node.querySelector("#folder_tree0 > ul > li > ul"));
        })
        .catch(function(e) {
            console.log("fetch fail", e);
    });
}

function getFileTypeByIcon(iconURL) {
    for (let [iconPattern, fileType] of ICON_TYPES) {
        if (iconPattern.test(iconURL)) {
            return fileType;
        }
    }
    return 'other';
}

const ICON_TYPES = new Map([
    [/\/f\/pdf-24$/, 'pdf'],
    [/\/f\/document-24$/, 'doc'],
    [/\/f\/powerpoint-24$/, 'slides'],
    [/\/f\/spreadsheet-24$/, 'spreadsheet'],
    [/\/f\/calc-24$/, 'calc'],
    [/\/folder\//, 'folder'],
]);


(function () {
    folder2Files();
})();
