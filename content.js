"use strict";

(function(){

const acceptedTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
const rejectedTags = [];
const criticalFontSize = 16;

const iconTypes = new Map([
	[/\/f\/pdf-24$/, 'pdf'],
	[/\/f\/document-24$/, 'doc'],
	[/\/f\/powerpoint-24$/, 'slides'],
	[/\/f\/spreadsheet-24$/, 'spreadsheet'],
	[/\/f\/calc-24$/, 'calc'],
]);

const extensionTypes = new Map([
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

function getFiletypeByIcon(icon) {
	for (const [iconPattern, filetype] of iconTypes) {
		if (iconPattern.test(icon)) {
			return filetype;
		}
	}
	return 'other';
}

function getFiletypeByExtension(extension) {
	if (extensionTypes.has(extension)) {
		return extensionTypes.get(extension);
	} else {
		return 'other';
	}
}

function getFontSize (el) {
	if (el.nodeType === 1) {
		return parseFloat(getComputedStyle(el).fontSize);
	} else {
		return 0;
	}
}

function getLevelByEl (el, accepted = false) {
	if (!el.childElementCount) {
		const fontSize = getFontSize(el);
		if ((acceptedTags.includes(el.tagName) || accepted || fontSize >= criticalFontSize) && el.textContent.trim()) {
			return fontSize;
		} else {
			return -1;
		}
	} else {
		return Math.max.apply(null,
			Array.from(el.childNodes)
			.filter(node => node.nodeType === 3 || !rejectedTags.includes(node.nodeName))
			.map(node => {
				if (node.nodeType === 3) {
					const fontSize = getFontSize(el);
					if ((accepted || fontSize >= criticalFontSize) && node.textContent.trim()) {
						return fontSize;
					} else {
						return -1;
					}
				} else if (acceptedTags.includes(el.tagName)) {
					return getLevelByEl(node, true);
				} else {
					return getLevelByEl(node, accepted);
				}
			})
		);
	}
}

function createDirObj (name, level) {
	return {
		type: 'dir',
		fetched: true,
		name,
		icon: 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/folder/1457712810/icon',
		children: [],
		level,
	}
}

function createFileObj (id, name, icon) {
	return {
		type: 'file',
		filetype: getFiletypeByIcon(icon),
		id,
		name,
		icon,
	};
}

function createFolderObj (id, name, icon) {
	return {
		type: 'dir',
		fetched: false,
		id,
		name,
		icon: icon || 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/folder/1457712810/icon',
		children: [],
	}
}

function getIconByActivity (activity) {
	return activity.querySelector('.activityinstance>a>.activityicon').src;
}

function getTitleByElementAndLevel (el, level) {
	if (!el.childElementCount) {
		if (getFontSize(el) === level) {
			return el.textContent.trim();
		} else {
			return '';
		}
	} else {
		return Array.from(el.childNodes)
			.filter(node => node.nodeType === 3 || !rejectedTags.includes(node.tagName))
			.map(node => {
				if (node.nodeType === 3) {
					return getFontSize(el) === level ? node.textContent.trim() : '';
				} else {
					return getTitleByElementAndLevel(node, level);
				}
			})
			.join('');
	}
}

function getTitlByEl (el, level) {
	if (level === undefined) {
		level = getLevelByEl(el);
	}
	if (level === -1) {
		return null;
	} else {
		return getTitleByElementAndLevel(el, level);
	}
}

function getNameByActivity (activity) {
	const instancename = activity.querySelector('.activityinstance>a>.instancename').childNodes;
	return Array.from(instancename)
		.filter(node => node.nodeType === 3)
		.map(node => node.textContent.trim())
		.join('')
		.trim();
}

function cleanData (data) {
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
			let name = content.getElementsByClassName('sectionname')[0].textContent.trim();
			const summary = getTitlByEl(content.getElementsByClassName('summary')[0]);
			if (summary && summary.length > 1 && summary.length < 50) {
				name = summary;
			}
			const dir = createDirObj(name, Infinity);
			let currentDir = dir;
			const activities = content.getElementsByClassName('activity');
			for (let activity of activities) {
				if (activity.classList.contains('modtype_label')) {
					let level = getLevelByEl(activity);
					if (level === -1) {
						// not a catagory label
						continue;
					}
					const name = getTitlByEl(activity);
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
						const file = createFileObj(activity.id, name, icon);
						currentDir.children.push(file);
					} else if (activity.classList.contains('modtype_equella')) {
						const file = createFileObj(activity.id, name, icon);
						currentDir.children.push(file);
					} else if (activity.classList.contains('modtype_folder')) {
						const folder = createFolderObj(activity.id, name, icon);
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
			data.children.push(dir);
		}
		cleanData(data);
		sendResponse(data);
	}
});

})();

