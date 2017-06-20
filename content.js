


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



function select(link) {
    link.parentNode.querySelector("input").checked = true;

}

function remove(link) {
    link.parentNode.querySelector("input").checked = false;
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

async function folder2Files(folderLink) {
    const ul = await findChildFiles(folderLink);
    const bt = document.createElement('button');
    if(ul) {
        bt.innerText = '+';
        folderLink.parentNode.appendChild(bt);
        folderLink.parentNode.appendChild(ul);
        ul.style.display = 'none';
        bt.addEventListener('click', () => {
            if(ul.style.display === '' ) {
                ul.style.display = 'none';
                bt.innerText = '+';
            } else {
                ul.style.display = '';
                bt.innerText = '-';
            }
        });
    } else {
        bt.innerText = 'NoInnerFile';
        folderLink.parentNode.appendChild(bt);
        bt.disabled = true;
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
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.style.marginLeft = '35px';
    el.parentNode.appendChild(checkbox);
}




function enSelectAll(folder) {
    const folderBox = folder.parentNode.querySelector('input');
    const linksInFolder = folder.parentNode.querySelectorAll("ul > li > span > a[href^='http://moodle.nottingham.ac.uk/']");
    const countInnerLink = linksInFolder.length;
    let countSelectedInnerLink = 0;
    folderBox.addEventListener('click', function() {
        if (folderBox.checked === true) {
            for (const innerLink of linksInFolder) {
                select(innerLink);
            }
            countSelectedInnerLink = countInnerLink;
        } else {
            for (const innerLink of linksInFolder) {
                remove(innerLink);
            }
            countSelectedInnerLink = 0;
        }
    });
    for (const innerLink of linksInFolder) {
        const innerLinkBox = innerLink.parentNode.querySelector('input');
        innerLinkBox.addEventListener('click', function() {
            if(innerLinkBox.checked === true) {
                countSelectedInnerLink += 1;
            } else {
                countSelectedInnerLink -= 1;
            }
            if(countSelectedInnerLink === countInnerLink) {
                select(folder);
            } else {
                remove(folder);
            }
        });
    }
}


async function findLinks() {
    links = document.querySelectorAll("#region-main a[href^='http://moodle.nottingham.ac.uk/']");
    for (const link of links) {
        if(link.querySelector('img')) {
            const fileType = getFileTypeByIcon(link);
            if (fileType !== 'assign' && fileType !== 'forum') {
                enSelectable(link);
            } 
            if (fileType === 'folder'){
                await folder2Files(link);
                if (link.parentNode.querySelector('button').innerText !== 'NoInnerFile') {
                    linksInFolder = link.parentNode.querySelectorAll("ul > li > span > a[href^='http://moodle.nottingham.ac.uk/']");
                    for (const innerLink of linksInFolder) {
                        enSelectable(innerLink);
                    }
                    enSelectAll(link);
                }
            }
        } else {
            enSelectable(link);
        }
    }
}


findLinks();
