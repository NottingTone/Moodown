const ICON_TYPES = new Map([
    [/\/f\/pdf-24$/, 'pdf'],
    [/\/f\/document-24$/, 'doc'],
    [/\/f\/powerpoint-24$/, 'slides'],
    [/\/f\/spreadsheet-24$/, 'spreadsheet'],
    [/\/f\/calc-24$/, 'calc'],
    [/\/folder\//, 'folder'],
    [/\/forum\//, 'forum'],
    [/\/assign\//, 'assign'],
]);


async function folder2Files (folder) {
    const ul = await findChildFiles(folder);
    const bt = document.createElement('button');
    if(ul) {
        bt.innerText = "+";
        folder.parentNode.appendChild(bt);
        folder.parentNode.appendChild(ul);
        ul.style.display = "none";
        bt.addEventListener("click", function() {
            if(ul.style.display === "" ) {
                ul.style.display = "none";
                bt.innerText = "+";
            } else {
                ul.style.display = "";
                bt.innerText = "-";
            }
        });
    } else {
        bt.innerText = "null";
        folder.parentNode.appendChild(bt);
        bt.disabled = true;
    }  
}



async function findChildFiles(folder) {
    try {
        const resp = await fetch(folder.href, {credentials: 'include'});
        const html = await resp.text();
        const doc = document.createElement('html');
        doc.innerHTML = html;
        return doc.querySelector('#folder_tree0 > ul > li > ul')
    } catch (e) {
        console.log('fetch fail', e);
    }
}


function getFileTypeByIcon(iconURL) {
    for (const [iconPattern, fileType] of ICON_TYPES) {
        if (iconPattern.test(iconURL)) {
            return fileType;
        }
    }
    return 'other';
}

function enSelectable(el) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    el.appendChild(checkbox);
}


async function findLinks() {
    links = document.querySelectorAll("#region-main a[href^='http://moodle.nottingham.ac.uk/']");
    for (const link of links) {
        if(link.querySelector('img')) {
            const fileType = getFileTypeByIcon(link);
            if (fileType !== 'folder' && fileType !== 'assign' && fileType !== 'forum') {
                enSelectable(link);
            } else if (fileType === 'folder'){
                await folder2Files(link);
                if (link.parentNode.querySelector("button").innerText!=="null") {
                    linksInFolder = link.parentNode.querySelectorAll("a[href^='http://moodle.nottingham.ac.uk/']");
                    for (const innerLink of linksInFolder) {
                        enSelectable(innerLink);
                    }
                }
            }
        } else {
            enSelectable(link);
        }
    }
}


findLinks();
