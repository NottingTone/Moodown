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

function genOuterPath(ul) {
    const outest = ul.parentNode;
    const nameArr = [];
    const wrapper = outest.querySelector('.sectionname');
    if (wrapper) {
        nameArr.push(wrapper.innerText);
    }
    return nameArr;
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


function genInnerPath(activity) {
    const sps = activity.querySelectorAll('span');
    const innerPath = [];
    let notSelected = true;
    console.log(sps);
    if (sps.length !== 0) {
        for (const sp of sps) {
            let spWeight=0;
            if(sp !== null && sp.innerText.trim().length !== 0) {
                spWeight = machingKeyWords(sp.innerText.trim());
                if (spWeight > 0) {
                    innerPath.push(sp.innerText.trim());
                    if (notSelected) {
                        const bt = document.createElement('button');
                        bt.innerText = 'Select All';
                        sp.appendChild(bt);
                        notSelected = false;
                    }
                }
            }
        }
        console.log(innerPath);
        // let path = innerPath.join('/');
        let path = innerPath.reduce(function(acc, val) {
            return '/' + val;
        },'');
        console.log(path);
        return path;
    }
}

const PROBABLE_NAME = new Map([
    [/General/, 10],
    [/Module Information/, 10], 
    [/Session/, 5], 
    [/Lectures?/, 10], 
    [/Seminar/, 10], 
    [/Notes?/, 10], 
    [/Slides?/, 10], 
    [/Paperwork/, 10], 
    [/Handouts?/, 10], 
    [/Problem/, 5], 
    [/Sheets?/, 10], 
    [/Solutions?/, 5],
    [/Vocabulary/, 10],
    [/Pronunciation/, 10], 
    [/Learning/, 5], 
    [/Resources?/, 10], 
    [/Samples?/, 5],
    [/Examination/, 10],
    [/Papers?/, 5],
    [/Solutions?/, 5],
    [/Final/, 5],
    [/Exam/, 5],
    [/\(.*\)/, -50],
    [/Lecturer/, -50],
]);



function machingKeyWords(text) {
    let sum = 0;
    for (const [keyPattern, weight] of PROBABLE_NAME) {
        if (keyPattern.test(text)) {
            sum += weight;
        }
    }
    return sum;
}




function groupByLabelName(ul) {
    const activities = ul.querySelectorAll('.activity');
    const group = new Map();
    let state = 'stop';
    let innerPath='';
    let arr = [];
    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        const classes = activity.classList;
        if ((state === 'stop' || state === 'begin') && classes.contains('label')) {
            state = 'begin';
            innerPath = genInnerPath(activity);
        } else if (state === 'stop' && (classes.contains('resource') || classes.contains('folder'))) {
            state = 'progress';
            arr.push(activity);
        } else if (state === 'begin' && (classes.contains('resource') || classes.contains('folder'))) {
            state = 'progress';
            arr.push(activity);
        } else if (state === 'progress' && (classes.contains('resource') || classes.contains('folder'))) {
            arr.push(activity);
        } else if (state === 'progress' && classes.contains('label')) {
            state = 'stop';
            group.set(innerPath, arr);
            arr = [];
            i--;
        } 
    }
    if (state === 'progress') {
        group.set(innerPath, arr);
    }
    return group;
}

function grouping(document) {
    const uls = document.querySelectorAll('ul.img-text');
    const sectionGroup = new Map();
    for(const ul of uls) {
        const outerPath = genOuterPath(ul);
        console.log(outerPath);
        const group = groupByLabelName(ul);
        sectionGroup.set(outerPath, group);
    }
    console.log(sectionGroup);
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

grouping(document);
