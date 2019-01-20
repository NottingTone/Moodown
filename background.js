"use strict";

const urlPrefixes = [
	'https://moodle.nottingham.ac.uk/course/view.php?id=',
	'https://moodle.nottingham.ac.uk/mod/folder/view.php?id='
];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.url) {
		for (let urlPrefix of urlPrefixes) {
			if (tab.url.startsWith(urlPrefix)) {
				chrome.pageAction.show(tabId);
				break;
			}
		}
	}
});
