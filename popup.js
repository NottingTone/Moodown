"use strict";

(function(){

window.runner = function (g) {
	return new Promise((resolve ,reject) => {
		function next(data) {
			let ret = g.next(data);
			if (ret.done) {
				resolve(ret.value);
			} else {
				window.a = ret;
				ret.value.then(next, reject);
			}
		}
		next();
	});
};

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

	let currentTab = tabs[0];
	let match;
	if (match = currentTab.url.match(/^http:\/\/moodle.nottingham.ac.uk\/mod\/folder\/view\.php\?id=(\d+)$/)) {
		let loading = document.getElementById('loading');
		loading.classList.remove('hidden');
		let id = match[1];
		getFolder(id)
		.then((folder) => {
			initComponents({
				name: `Folder - ${folder.name}`,
				type: 'dir',
				files: [folder],
			});
			loading.classList.add('hidden');
		});
	} else if (currentTab.url.startsWith('http://moodle.nottingham.ac.uk/course/view.php?id=')) {
		chrome.tabs.sendMessage(tabs[0].id, "requestData", function (response) {
			initComponents(response);
		});
	}
});

})();