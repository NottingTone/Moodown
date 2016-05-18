(function(){

var iconTypes = {
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/pdf-24': 'PDF',
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/document-24': 'Word',
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/powerpoint-24': 'PPT',
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/calc-24': 'Excel'
};

function createDirObj (name, icon) {
	return {
		type: 'dir',
		name: name,
		icon: icon || 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/folder/1457712810/icon',
		files: []
	}
}

function createFileObj (id, name, icon) {
	return {
		type: 'file',
		fileType: iconTypes[icon] || 'unknown',
		id: id,
		name: name,
		icon: icon
	};
}

function createFolderObj (id, name, icon) {
	return {
		type: 'folder',
		id: id,
		name: name,
		icon: icon || 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/folder/1457712810/icon'
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
	var name = '';
	var instancename = activity.querySelector('.activityinstance>a>.instancename').childNodes;
	for (var i in instancename) {
		if (instancename[i].nodeType === 3) {
			name += instancename[i].textContent;
		}
	}
	return name;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request === 'requestData') {

		var module = document.getElementById('course-header').textContent;
		var data = {
			module: module,
			files: []
		};
		var sections = document.querySelectorAll('.section.main:not(.hidden)');
		for (var i = 0; i < sections.length; ++i) {
			var section = sections[i].getElementsByClassName('content')[0];
			var name = section.getElementsByClassName('sectionname')[0].textContent;
			var dir = createDirObj(name);
			var currentDir = dir;
			var activities = section.getElementsByClassName('activity');
			for (var j = 0; j < activities.length; ++j) {
				var activity = activities[j];
				var id = getIdByActivity(activity);
				if (activity.classList.contains('modtype_label')) {
					var name = getLabelByActivity(activity);
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
					var icon = getIconByActivity(activity);
					var name = getNameByActivity(activity);
					if (activity.classList.contains('modtype_resource')) {
						var file = createFileObj(id, name, icon);
						currentDir.files.push(file);
					} else if (activity.classList.contains('modtype_folder')) {
						var folder = createFolderObj(id, name, icon);
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

