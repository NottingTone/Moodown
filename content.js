"use strict";

(function(){

const iconTypes = {
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/pdf-24': 'PDF',
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/document-24': 'Word',
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/powerpoint-24': 'PPT',
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/spreadsheet-24': 'Excel',
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/calc-24': 'Calc',
};

const acceptableTags = ['strong', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

function labelLevel (label) {
	for (let i = 0; i < acceptableTags.length; ++i) {
		if (label.querySelector(acceptableTags[i])) {
			return i + 1;
		}
	}
	return -1;
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
		fileType: iconTypes[icon] || 'unknown',
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

function getLabelByActivity (activity) {
	for (let tagName of acceptableTags) {
		let tag = activity.querySelector(tagName);
		if (tag) {
			return tag.textContent;
		}
	}
	return null;
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

		let module = document.getElementById('course-header').textContent;
		let data = {
			type: 'module',
			name: module,
			files: [],
		};
		let sections = document.querySelectorAll('.section.main:not(.hidden)');
		for (let section of sections) {
			let content = section.getElementsByClassName('content')[0];
			let name = content.getElementsByClassName('sectionname')[0].textContent;
			let summary = getLabelByActivity(content.getElementsByClassName('summary')[0]);
			if (summary && summary.length > 1) {
				name = summary;
			}
			let dir = createDirObj(name, 0);
			let currentDir = dir;
			let activities = content.getElementsByClassName('activity');
			for (let activity of activities) {
				let id = getIdByActivity(activity);
				if (activity.classList.contains('modtype_label')) {
					let name = getLabelByActivity(activity);
					if (name === null) {
						// not a catagory label
						continue;
					}
					let newDir = createDirObj(name, labelLevel(activity));
					while (currentDir.level >= newDir.level && currentDir !== dir) {
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

