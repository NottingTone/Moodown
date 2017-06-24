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

function unSelect(link) {
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
            console.log(sp.textContent);
            return sp.textContent;
        }
    } else {
        for (const p of ps) {
            return p.textContent;
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
    return ul.parentNode.querySelector('h3').textContent;
}




function labelNameTooLong(labelName) {
    return labelName.length > 30;
}



function genOuterPath(ul) {
    const outest = ul.parentNode;
    const nameArr = [];
    const wrapper = outest.querySelector('.sectionname');
    if (wrapper) {
        nameArr.push(wrapper.textContent);
    }
    const summary = ul.parentNode.querySelector('.summary');
    const sps = summary.querySelectorAll('span');
    if (sps.length !== 0) {
        for (const sp of sps) {
            let spWeight=0;
            if(sp !== null && sp.textContent.trim().length !== 0) {
                spWeight = machingKeyWords(sp.textContent.trim());
                if (spWeight > 0) {
                    nameArr.push(sp.textContent.trim());
                }
            }
        }
        // let path = innerPath.join('/');
        let path = nameArr.reduce(function(acc, val) {
            return '/' + val;
        },'');
    }
    return nameArr;
}

function genInnerPath(activity) {
    const innerPath = [];
    const spans = activity.querySelectorAll('span');
    const h3 = activity.querySelector('h3');
    if (spans.length !== 0) {
        for (const span of spans) {
            let spanWeight=0;
            const txt = span.textContent.trim();
            if(span !== null && txt.length !== 0) {
                spanWeight = machingKeyWords(txt);
                if (spanWeight > 0) {
                    innerPath.push(txt);
                }
            }
        }
    } else if (h3) {
        const txt = h3.textContent;
        innerPath.push(txt);
    }
    // let path = innerPath.join('/');
    let path = innerPath.reduce(function(acc, val) {
        return '/' + val;
    },'');
    return path;
}

const PROBABLE_NAME = new Map([
    [/General/gi, 10],
    [/Module Information/gi, 10], 
    [/Session/gi, 5], 
    [/Lectures?/gi, 10], 
    [/Seminar/gi, 10], 
    [/Notes?/gi, 10], 
    [/Slides?/gi, 10], 
    [/Paperwork/gi, 10], 
    [/Handouts?/gi, 10], 
    [/Problem/gi, 5], 
    [/Sheets?/gi, 10], 
    [/Solutions?/gi, 5],
    [/Vocabulary/gi, 10],
    [/Pronunciation/gi, 10], 
    [/Learning/gi, 5], 
    [/Resources?/gi, 10], 
    [/Samples?/gi, 5],
    [/Examination/gi, 10],
    [/Papers?/gi, 5],
    [/Solutions?/gi, 5],
    [/Final/gi, 5],
    [/Exam/gi, 5],
    [/\(.*\)/gi, -50],
    [/Lecturer/gi, -50],
    [/homework/gi, 10],
    [/exercises/gi, 10],
    [/lab/gi, 10],
    [/coursework/gi, 10],
    [/presentations?/gi, 10],
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


function addSelectAllBtn(node, arr) {
    const btn = document.createElement('button');
    btn.textContent = 'Select All';
    btn.classList.add('my-selectAll-btn');
    node.appendChild(btn);
    btn.addEventListener('click', () => {
        console.log(arr);
    });
}



function groupByLabelName(ul) {
    const activities = ul.querySelectorAll('.activity');
    if (activities.length !== 0) {
        const group = new Map();
        const BEGIN = ['Ready', 'Label', 'NoLabel'];
        const RES = ['Nothing', 'Valid'];
        const END = ['Not-Stop', 'Stop-Label', 'Stop-NoLabel'];
        let begin = BEGIN[0];
        let res = RES[0];
        let end = END[0];
        let selectAllBtnPos;
        let arr = [];
        const endHandle = (activity) => {
            if (res === RES[1]) {
                if (begin === BEGIN[1]) {
                    addSelectAllBtn(selectAllBtnPos, arr);
                } else if (begin === BEGIN[2]) {
                    addSelectAllBtn(activity.parentNode.parentNode.querySelector('.sectionname'), arr);
                }
            } 
            innerPath = genInnerPath(activity);
            group.set(innerPath, arr);
            arr = [];
            begin = BEGIN[0];
            res = RES[0];
            end = END[0];
        };
        let activity;
        for (let i = 0; i < activities.length; i++) {
            activity = activities[i];
            const classes = activity.classList;
            if (begin === BEGIN[0]) {
                if (classes.contains('label')) {
                    begin = BEGIN[1];
                    selectAllBtnPos = activity;
                } else if (classes.contains('resource') || classes.contains('folder')) {
                    begin = BEGIN[2];
                    res = RES[1];
                    arr.push(activity);
                }
            } else if (begin === BEGIN[1]) {
                if (classes.contains('resource') || classes.contains('folder')) {
                    res = RES[1];
                    arr.push(activity);
                } else if (classes.contains('label')) { 
                    if (res === RES[0]) {
                        selectAllBtnPos = activity;
                    } else {
                        end = END[1];
                    }
                }
            } else {
                if (classes.contains('resource') || classes.contains('folder')) {
                    arr.push(activity);
                } else if (classes.contains('label')) { 
                    end = END[1];
                }
            }
            if (end === END[1]) {
                endHandle(activity);
                i--;
            }
        }
        if(end === END[0]) {
            end = END[2];
            endHandle(activity);
        }
        return group;
    }
}

function grouping(document) {
    const uls = document.querySelectorAll('ul.img-text');
    const sectionGroup = new Map();
    for(const ul of uls) {
        const outerPath = genOuterPath(ul);
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
    bt.textContent = '-';
}

function hideFolder(folderLink) {
    const ul = folderLink.parentNode.querySelector('ul');
    const bt = folderLink.parentNode.querySelector('button');
    ul.style.display = 'none';
    bt.textContent = '+';
}

async function folder2Files(folderLink) {
    const ul = await findChildFiles(folderLink);
    const bt = document.createElement('button');
    if(ul) {
        bt.textContent = '+';
        folderLink.parentNode.appendChild(bt);
        folderLink.parentNode.appendChild(ul);
        ul.style.display = 'none';
        bt.addEventListener('click', () => {
            if(ul.style.display === '' ) {
                ul.style.display = 'none';
                bt.textContent = '+';
            } else {
                ul.style.display = '';
                bt.textContent = '-';
            }
        });
    } else {
        bt.textContent = 'NoInnerFile';
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
                unSelect(innerLink);
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
                unSelect(folder);
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
        if (link.parentNode.querySelector('button').textContent !== 'NoInnerFile') {
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
