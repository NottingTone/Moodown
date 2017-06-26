function isFile(href){
    return href.startsWith('http://moodle.nottingham.ac.uk/');
}

function traversal(node) {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A' && isFile(node.href)) {
        return node;
    }

    const subTrees = [];
    for (const child of node.childNodes) {
        const subTree = traversal(child);
        if (subTree.length || subTree instanceof Node) {
            subTrees.push(subTree);
        }
    }
    return [node, subTrees];
}

const dom = traversal(document.querySelector('#region-main'));
console.log(dom);



