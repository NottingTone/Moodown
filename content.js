'use strict';
function isFile(href){
    return href.startsWith('http://moodle.nottingham.ac.uk/');
}

function traversal(node) {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A' && isFile(node.href)) {
        return [node, []];
    } else {
        const subTrees = [];
        for (const child of node.childNodes) {
            const subTree = traversal(child);
            if (subTree.length || subTree instanceof Node) {
                subTrees.push(subTree);
            }
        }
        return [node, subTrees];
    }
}


function getNameByUl(ul) {
    let txt = 'ul';
    if (ul.previousSibling) {
        txt = ul.previousSibling.textContent;
    }
    return txt;
}
function getNameByLi(li) {
    let txt = 'li';
    if (li.classList.contains('section')) {
        const sectionname = li.querySelector('div.content > .sectionname');
        if (sectionname) {
            txt = sectionname.textContent;
        }
    }
    return txt;
}
function getNameByP(p) {
    console.log('i am p');
    return 'p';
}
function foo() {
    console.log("fofo");
    return 'foo';
}


function getNameFunc(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName;
        // console.log(tag);
        if (tag === 'UL') {
            return getNameByUl(node);
        } else if (tag === 'LI') {
            return getNameByLi(node);
        } else if (tag === 'P') {
            return getNameByP(node);
        } else {
            return null;
        }
    }
    return null;
}



function getNodeName(node) {
    return getNameFunc(node);
}


function structurlize() {
    const sourceTree = traversal(document.querySelector('div.course-content'));
    genStructure(sourceTree);
    console.log(sourceTree);
    return sourceTree;
}


function genStructure(curTree) {
    const curParentNode = curTree[0];
    const curSubTrees = curTree[1];
    const layerName = getNodeName(curParentNode);
    curTree.push(layerName);
    for (const subTree of curSubTrees) {
        genStructure(subTree);
    }
}

structurlize();
