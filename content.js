"use strict";

(function(){

const acceptedTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
const rejectedTags = [];
const criticalFontSize = 16;

const ICON_TYPES = new Map([
	[/\/f\/pdf-24$/, 'pdf'],
	[/\/f\/document-24$/, 'doc'],
	[/\/f\/powerpoint-24$/, 'slides'],
	[/\/f\/spreadsheet-24$/, 'spreadsheet'],
	[/\/f\/calc-24$/, 'calc'],
]);

const EXTENSION_TYPES = new Map([
	['pdf', 'pdf'],
	['doc', 'doc'],
	['ppt', 'slides'],
	['pptx', 'slides'],
	['xls', 'spreadsheet'],
	['xlsx', 'spreadsheet'],
	['zip', 'archive'],
	['7z', 'archive'],
	['rar', 'archive'],
	['gz', 'archive'],
]);

const TYPE_ICONS = new Map([
	['pdf', 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_science/core/1477502187/f/pdf-24'],
	['doc', 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_science/core/1477502187/f/document-24'],
	['slides', 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_science/core/1477502187/f/powerpoint-24'],
	['spreadsheet', 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_science/core/1477502187/f/spreadsheet-24'],
	['calc', 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_science/core/1477502187/f/calc-24'],
	['archive', 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_science/core/1477502187/f/archive-24'],
	['other', 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_science/core/1477502187/f/unknown-24'],
	['folder', 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/folder/1457712810/icon'],
]);

function getFiletypeByIcon(icon) {
	for (const [iconPattern, filetype] of ICON_TYPES) {
		if (iconPattern.test(icon)) {
			return filetype;
		}
	}
	return 'other';
}

function getFiletypeByExtension(extension) {
	if (EXTENSION_TYPES.has(extension)) {
		return EXTENSION_TYPES.get(extension);
	} else {
		return 'other';
	}
}

function getFontSize(el) {
	if (el.nodeType === 1) {
		return parseFloat(getComputedStyle(el).fontSize);
	} else {
		return 0;
	}
}

function getFontWeight(el) {
	if (el.nodeType === 1) {
		const weight = getComputedStyle(el).fontWeight;
		switch (weight) {
		case 'normal':
			return 400;
		case 'bold':
			return 700;
		default:
			return parseInt(weight);
		}
	} else {
		return 0;
	}
}

function getElLevel(el) {
	return getFontSize(el) + (getFontWeight(el) - 400) / 150;
}

function getLevelByEl(el, accepted = false) {
	if (![1, 3].includes(el.nodeType)) {
		return -1;
	} else if (!el.childElementCount) {
		const level = getElLevel(el);
		if ((acceptedTags.includes(el.tagName) || accepted || level >= criticalFontSize) && el.textContent.trim()) {
			return [level, el.textContent.trim().replace(/\s+/g, ' ')];
		} else {
			return [-1];
		}
	} else {
		return Array.from(el.childNodes)
			.filter(node => node.nodeType === 3 || !rejectedTags.includes(node.nodeName))
			.map(node => {
				if (acceptedTags.includes(node.tagName)) {
					return getLevelByEl(node, true);
				} else {
					return getLevelByEl(node, accepted);
				}
			})
			.reduce((a, b) => a[0] > b[0] ? a : b, [-1]);
	}
}

function createDirObj(name, level) {
	return {
		type: 'dir',
		fetched: true,
		name,
		icon: TYPE_ICONS.get('folder'),
		children: [],
		level,
	}
}

function createFileObj(id, name, icon) {
	return {
		type: 'file',
		filetype: getFiletypeByIcon(icon),
		id,
		name,
		icon,
	};
}

function createFileObjByUrl(url, name) {
	const match = url.match(/\.([^.]*)$/);
	const extension = match ? match[1] : null;
	const filetype = EXTENSION_TYPES.get(extension) || 'other';
	return {
		type: 'file',
		filetype,
		name,
		url,
		icon: TYPE_ICONS.get(filetype),
	}
}

function createFolderObj(id, name, icon) {
	return {
		type: 'dir',
		fetched: false,
		id,
		name,
		icon: icon || TYPE_ICONS.get('folder'),
		children: [],
	}
}

function getIdByActivity(activity) {
	return activity.id.split('-')[1];
}

function getIconByActivity(activity) {
	return activity.querySelector('.activityinstance>a>.activityicon').src;
}

function getNameByActivity(activity) {
	const instancename = activity.querySelector('.activityinstance>a>.instancename').childNodes;
	return Array.from(instancename)
		.filter(node => node.nodeType === 3)
		.map(node => node.textContent.trim())
		.join('')
		.trim();
}

function cleanData(data) {
	delete data.level;
	delete data.parent;
	if (data.children) {
		for (let file of data.children) {
			cleanData(file);
		}
	}
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request === 'requestData') {

		const module = document.getElementById('course-header').textContent.trim();
		const data = {
			type: 'root',
			name: module,
			children: [],
		};
		const sections = document.querySelectorAll('.section.main:not(.hidden)');
		for (const section of sections) {
			const content = section.getElementsByClassName('content')[0];
			let name = content.getElementsByClassName('sectionname')[0].textContent.trim().replace(/\s+/g, ' ');
			const summary = content.getElementsByClassName('summary')[0].textContent.trim().replace(/\s+/g, ' ');
			if (summary && summary.length > 1 && summary.length < 50) {
				name = summary;
			}
			const dir = createDirObj(name, Infinity);
			let currentDir = dir;
			const activities = content.querySelectorAll('.activity,a[href]');
			for (let activity of activities) {
				if (activity.tagName === 'A') {
					if (activity.href.startsWith('http://moodle.nottingham.ac.uk/pluginfile.php/')) {
						const file = createFileObjByUrl(activity.href, activity.textContent.trim().replace(/\s+/g, ' '));
						currentDir.children.push(file);
					}
				} else {
					let id = getIdByActivity(activity);
					if (activity.classList.contains('modtype_label')) {
						const [level, name] = getLevelByEl(activity);
						if (level === -1) {
							// not a catagory label
							continue;
						}
						const newDir = createDirObj(name, level);
						while (currentDir.level <= newDir.level && currentDir !== dir) {
							currentDir = currentDir.parent;
						}
						newDir.parent = currentDir;
						currentDir.children.push(newDir);
						currentDir = newDir;
					} else {
						if (!activity.querySelector('.activityinstance>a')) {
							// link unavailable
							continue;
						}
						const icon = getIconByActivity(activity);
						const name = getNameByActivity(activity);
						if (activity.classList.contains('modtype_resource')) {
							const file = createFileObj(`resource-${id}`, name, icon);
							currentDir.children.push(file);
						} else if (activity.classList.contains('modtype_equella')) {
							const file = createFileObj(`equella-${id}`, name, icon);
							currentDir.children.push(file);
						} else if (activity.classList.contains('modtype_folder')) {
							const folder = createFolderObj(`folder-${id}`, name, icon);
							currentDir.children.push(folder);
						}
					}
					/*
						modtype_feedback
						modtype_url
						modtype_page
						modtype_quiz
						modtype_book
						modtype_equella
					*/
				}
			}
			data.children.push(dir);
		}
		cleanData(data);
		sendResponse(data);
	}
});

})();

