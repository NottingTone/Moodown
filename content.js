"use strict";

(function(){

const iconTypes = new Map([
	[/\/f\/pdf-24$/, 'PDF'],
	[/\/f\/document-24$/, 'Word'],
	[/\/f\/powerpoint-24$/, 'PPT'],
	[/\/f\/spreadsheet-24$/, 'Excel'],
	[/\/f\/calc-24$/, 'Calc'],
]);

const acceptedTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
const rejectedTags = [];
const criticalFontSize = 16;

function getFiletypeByIcon (icon) {
	for (let [iconPattern, filetype] of iconTypes) {
		if (iconPattern.test(icon)) {
			return filetype;
		}
	}
	return 'unknown';
}

function getFontSize (el) {
	return parseFloat(getComputedStyle(el).fontSize);
}

function getLevelByEl (el, accepted = false) {
	if (!el.childElementCount) {
		let fontSize = getFontSize(el);
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
					let fontSize = getFontSize(el);
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
		name,
		icon: 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/folder/1457712810/icon',
		files: [],
		level,
	}
}

function createFileObj (id, name, icon) {
	return {
		type: 'file',
		fileType: getFiletypeByIcon(icon),
		id,
		name,
		icon,
	};
}

function createFolderObj (id, name, icon) {
	return {
		type: 'folder',
		id,
		name,
		icon: icon || 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/folder/1457712810/icon',
	}
}

function getIdByActivity (activity) {
	return activity.id.split('-')[1];
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
	let name = '';
	let instancename = activity.querySelector('.activityinstance>a>.instancename').childNodes;
	return Array.from(instancename)
		.filter(node => node.nodeType === 3)
		.map(node => node.textContent.trim())
		.join('')
		.trim();
}

function cleanData (data) {
	delete data.level;
	delete data.parent;
	if (data.files) {
		for (let file of data.files) {
			cleanData(file);
		}
	}
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request === 'requestData') {

		let module = document.getElementById('course-header').textContent.trim();
		let data = {
			type: 'module',
			name: module,
			files: [],
		};
		let sections = document.querySelectorAll('.section.main:not(.hidden)');
		for (let section of sections) {
			let content = section.getElementsByClassName('content')[0];
			let name = content.getElementsByClassName('sectionname')[0].textContent.trim();
			let summary = getTitlByEl(content.getElementsByClassName('summary')[0]);
			if (summary && summary.length > 1 && summary.length < 50) {
				name = summary;
			}
			let dir = createDirObj(name, Infinity);
			let currentDir = dir;
			let activities = content.getElementsByClassName('activity');
			for (let activity of activities) {
				let id = getIdByActivity(activity);
				if (activity.classList.contains('modtype_label')) {
					let level = getLevelByEl(activity);
					if (level === -1) {
						// not a catagory label
						continue;
					}
					let name = getTitlByEl(activity);
					let newDir = createDirObj(name, level);
					while (currentDir.level <= newDir.level && currentDir !== dir) {
						currentDir = currentDir.parent;
					}
					newDir.parent = currentDir;
					currentDir.files.push(newDir);
					currentDir = newDir;
				} else {
					if (!activity.querySelector('.activityinstance>a')) {
						// link unavailable
						continue;
					}
					let icon = getIconByActivity(activity);
					let name = getNameByActivity(activity);
					if (activity.classList.contains('modtype_resource')) {
						let file = createFileObj(id, name, icon);
						currentDir.files.push(file);
					} else if (activity.classList.contains('modtype_folder')) {
						let folder = createFolderObj(id, name, icon);
						currentDir.files.push(folder);
					}
				}
				/*
					modtype_feedback
					modtype_url
					modtype_page
					modtype_quiz
					modtype_book
				*/
			}
			data.files.push(dir);
		}
		cleanData(data);
		sendResponse(data);
	}
});

})();

