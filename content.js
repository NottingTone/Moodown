(function(){

let iconTypes = {
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/pdf-24': 'PDF',
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/document-24': 'Word',
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/powerpoint-24': 'PPT',
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/calc-24': 'Excel'
};

function createDirObj (name, icon) {
	return {
		type: 'dir',
		name,
		icon: icon || 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/folder/1457712810/icon',
		files: [],
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
	var strong = activity.querySelector('strong');
	return strong ? strong.textContent : null;
}

function getNameByActivity (activity) {
	let name = '';
	let instancename = activity.querySelector('.activityinstance>a>.instancename').childNodes;
	for (let node of instancename) {
		if (node.nodeType === 3) {
			name += node.textContent;
		}
	}
	return name;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request === 'requestData') {

		let module = document.getElementById('course-header').textContent;
		let data = {
			module: module,
			files: [],
		};
		let sections = document.querySelectorAll('.section.main:not(.hidden)');
		for (let section of sections) {
			let content = section.getElementsByClassName('content')[0];
			let name = content.getElementsByClassName('sectionname')[0].textContent;
			let dir = createDirObj(name);
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
					currentDir = createDirObj(name);
					dir.files.push(currentDir);
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
				*/
			}
			data.files.push(dir);
		}

		sendResponse(data);
	}
});

})();

