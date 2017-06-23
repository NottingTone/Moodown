const ICON_TYPES = new Map([
    [/\/pdf[-\d+]*$/, 'pdf'],
    [/\/document[-\d+]*$/, 'doc'],
    [/\/powerpoint[-\d+]*$/, 'ppt'],
    [/xlsx|\/spreadsheet[-\d+]*$/, 'xls'],
    [/unknown|\/unknown[-\d+]*$/, 'unknownres'],
    [/\/quiz\//, 'quiz'],
    [/\/text[-\d+]*$/, 'txt'],
    [/\/url\//, 'url'],
    [/\/calc\//, 'calc'],
    [/\/png[-\d+]*$/, 'png'],
    [/\/folder\/|\/folder[-\d+]*$/, 'folder'],
    [/\/forum\//, 'forum'],
    [/\/assign\//, 'assign'],
    [/\/attendance\//,'attendance'],
    [/\/html[-\d+]*$/, 'html'],
    [/\/sourcecode[-\d+]*$/, 'sourcecode'],
    [/\/archive[-\d+]*$/, 'zip'],
    [/.jpg$/, 'jpg'],
]);


const URL_TYPES = new Map([
    [/\.pdf$/, 'pdf'],
    [/\.pptx?$/, 'ppt'],
]);


function getFileType(link) {
    if(link.querySelector('img')) {
        const iconURL = link.querySelector('img').src;
        for (const [iconPattern, fileType] of ICON_TYPES) {
            if (iconPattern.test(iconURL)) {
                return fileType;
            }
        }
        return 'other';
    } else {
        for (const [iconPattern, fileType] of ICON_TYPES) {
            if (iconPattern.test(iconURL)) {
                return fileType;
            }
        }
        return 'other';
    }
}

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
        // console.log('fetch fail', e);
    }
}




function getLabelName(activity) {
    const ps = activity.querySelectorAll('p');
    const hs = activity.querySelectorAll('h4');
    if (hs.length !== 0) {
        for (const h of hs) {
            let sp = h.querySelector('span');
            if(sp.querySelector('span')) {
                sp = sp.querySelector('span');
            }
            console.log(sp.innerText);
            return sp.innerText;
        }
    } else {
        for (const p of ps) {
            return p.innerText;
        }
    }
}   


function isLabelValid(activity) {
    const p = activity.querySelectorAll('p');
    const h = activity.querySelectorAll('h4');
    return p.length !== 0 || h.length !== 0;

    // label without P or label with Many Ps are all invalid
} 
function getSectionName(ul) {
    return ul.parentNode.querySelector('h3').innerText;
}


function groupBySectionName(sectionName, activities) {
    const group = new Map();
    let state = 'stop';
    let labelName;
    let arr = [];
    let partNum = 1;
    if (!activities[0].classList.contains('label')) {
        state = 'progress';
        labelName = sectionName + ' part_' + partNum;
    }
    for(let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        if((state === 'stop' || state === 'begin') && activity.classList.contains('label')) {
            state = 'begin';
        } else if(state === 'begin' && (activity.classList.contains('resource') || activity.classList.contains('folder'))) {
            state = 'progress';
            labelName = sectionName + ' part_' + partNum;
            arr.push(activity);
        } else if(state === 'progress' && (activity.classList.contains('resource') || activity.classList.contains('folder'))) {
            arr.push(activity);
        } else if(state === 'progress' && activity.classList.contains('label')) {
            state = 'stop';
            group.set(labelName, arr);
            partNum++;
            arr = [];
            i--;
        }
    }
    if(state === 'progress') {
        group.set(labelName, arr);
    }
    return group;
} 

function labelNameTooLong(labelName) {
    return labelName.length > 30;
}

function download(group) {
    for(const [key, arr] of group) {
        for(const [innerKey, innerArr] of arr) {
            for(const tmp of innerArr) {
                console.log(tmp);
                const link = tmp.querySelector("a");
                console.log(link.href);
                // chrome.downloads.download({
                //   url: link.href,
                //   filename: link.innerText,
                // });
            }
        }
    }
   
}


function groupByLabelName(ul, sectionName) {
    const activities = ul.querySelectorAll('.activity');
    const group = new Map();
    let state = 'stop';
    let labelName;
    let arr = [];
    if(!activities[0].classList.contains('label')) {
        return groupBySectionName(sectionName, activities);
    } else {
        for(let i = 0; i < activities.length; i++) {
            const activity = activities[i];
            if((state === 'stop' || state === 'begin') && activity.classList.contains('label')) {
                state = 'begin';
            } else if(state === 'begin' && (activity.classList.contains('resource') || activity.classList.contains('folder'))) {
                state = 'progress';
                if(!isLabelValid(activities[i-1])) {
                    return groupBySectionName(sectionName, activities);
                } else {
                    labelName = getLabelName(activities[i-1]);
                    if (labelNameTooLong(labelName)) {
                        return groupBySectionName(sectionName, activities);
                    }
                    arr.push(activity);
                }
            } else if(state === 'progress' && (activity.classList.contains('resource') || activity.classList.contains('folder'))) {
                arr.push(activity);
            } else if(state === 'progress' && activity.classList.contains('label')) {
                state = 'stop';
                group.set(labelName, arr);
                arr = [];
                i--;
            } 
        }
        if(state === 'progress') {
            group.set(labelName, arr);
        }
    }
    return group;
}

function grouping() {
    const uls = document.querySelectorAll('ul.img-text');
    const sectionGroup = new Map();
    for(let ul of uls) {
        const sectionName = getSectionName(ul);
        // console.log(sectionName);
        const group = groupByLabelName(ul, sectionName);
        sectionGroup.set(sectionName, group);
    }
    return sectionGroup;
}

function showFolder(folderLink) {
    const ul = folderLink.parentNode.querySelector('ul');
    const bt = folderLink.parentNode.querySelector('button');
    ul.style.display = '';
    bt.innerText = '-';
}

function hideFolder(folderLink) {
    const ul = folderLink.parentNode.querySelector('ul');
    const bt = folderLink.parentNode.querySelector('button');
    ul.style.display = 'none';
    bt.innerText = '+';
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
        folderLink.parentNode.querySelector('input').disabled = true;
    }  
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
    const InnerLinkLength = linksInFolder.length;
    let selectedInnerLinkLength = 0;
    folderBox.addEventListener('click', function() {
        if (folderBox.checked === true) {
            for (const innerLink of linksInFolder) {
                select(innerLink);
            }
            selectedInnerLinkLength = InnerLinkLength;
            showFolder(folder);
        } else {
            for (const innerLink of linksInFolder) {
                remove(innerLink);
            }
            selectedInnerLinkLength = 0;
            hideFolder(folder);
        }
    });
    for (const innerLink of linksInFolder) {
        const innerLinkBox = innerLink.parentNode.querySelector('input');
        innerLinkBox.addEventListener('click', function() {
            if(innerLinkBox.checked === true) {
                selectedInnerLinkLength += 1;
            } else {
                selectedInnerLinkLength -= 1;
            }
            if(selectedInnerLinkLength === InnerLinkLength) {
                select(folder);
            } else {
                remove(folder);
            }
        });
    }
}

async function findLinks(document) {
    resources = document.querySelectorAll('.resource');
    for (const res of resources) {
        const link = res.querySelector('a');
        enSelectable(link);
    }
    folders = document.querySelectorAll('.folder');
    for (const folder of folders) {
        const link = folder.querySelector('a');
        enSelectable(link);
        await folder2Files(link);
        if (link.parentNode.querySelector('button').innerText !== 'NoInnerFile') {
            linksInFolder = link.parentNode.querySelectorAll("ul > li > span > a[href^='http://moodle.nottingham.ac.uk/']");
            for (const innerLink of linksInFolder) {
                enSelectable(innerLink);
            }
            enSelectAll(link);
        }
    }
}

findLinks(document);


