const ICON_TYPES = new Map([
    [/\/pdf[-\d+]*$/, 'pdf'],
    [/\/document[-\d+]*$/, 'doc'],
    [/\/powerpoint[-\d+]*$/, 'slides'],
    [/\/spreadsheet[-\d+]*$/, 'spreadsheet'],
    [/\/text[-\d+]*$/, 'text'],
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
        // console.log('fetch fail', e);
    }
}


function getLabelName(activity) {
    const p = activity.querySelector("p");
    return p.innerText;
}   


function isLabelValid(activity) {
    const p = activity.querySelectorAll('p');
    return p.length === 1;
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
        labelName = sectionName + ' ' + partNum;
    }
    for(let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        if((state === 'stop' || state === 'begin') && activity.classList.contains('label')) {
            state = 'begin';
        } else if(state === 'begin' && (activity.classList.contains('resource') || activity.classList.contains('folder'))) {
            state = 'progress';
            labelName = sectionName + ' ' + partNum;
            arr.push(activity);
        } else if(i === (activities.length - 1)) {
            state = 'stop';
            group.set(labelName, arr);
            return group;
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
    group.set(labelName, arr);
    return group;
}  

function groupByLabelName(ul, sectionName) {
    const activities = ul.querySelectorAll('.activity');
    const group = new Map();
    let state = 'stop';
    let labelName;
    let arr = [];
    if(!activities[0].classList.contains('label')) {
        // console.log("hrererer");
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
                    arr.push(activity);
                }
            } else if (i === (activities.length - 1)) {
                state = 'stop';
                group.set(labelName, arr);
                return group;
            } else if(state === 'progress' && (activity.classList.contains('resource') || activity.classList.contains('folder'))) {
                arr.push(activity);
            } else if(state === 'progress' && activity.classList.contains('label')) {
                state = 'stop';
                group.set(labelName, arr);
                arr = [];
                i--;
            } 
        }
        group.set(labelName, arr);
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
    console.log(sectionGroup);
}

function showFolder(folderLink) {

}

function hideFolder(folderLink) {

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
            const fileType = getFileTypeByIcon(link.querySelector('img').src);
            if (fileType !== 'assign' && fileType !== 'forum' && fileType !== 'attendance' && fileType !== 'html' && fileType !== 'url') {
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
grouping();
