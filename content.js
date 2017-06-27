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


function chooseFunc(node) {
    function getNameByUl(ul) {
        console.log('i am ul');
        return 'ul';
    }
    function getNameByLi(li) {
        console.log('i am li');
        return 'li';
    }
    function getNameByP(p) {
        console.log('i am p');
        return 'p';
    }
    function foo() {
        console.log("fofo");
        return 'foo';
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName;
        // console.log(tag);
        if (tag === 'UL') {
            return getNameByUl;
        } else if (tag === 'LI') {
            return getNameByLi;
        } else if (tag === 'P') {
            return getNameByP;
        } else {
            return foo;
        }
    }
    return foo;
}



function getNodeName(node) {
    const getNameFunc = chooseFunc(node);
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
