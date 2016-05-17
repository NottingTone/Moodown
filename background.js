const urlPrefixes = [
	'http://moodle.nottingham.ac.uk/course/view.php?id=',
	'http://moodle.nottingham.ac.uk/mod/folder/view.php?id='
];

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (tab.url) {
		for (var idx in urlPrefixes) {
			if (tab.url.slice(0, urlPrefixes[idx].length) === urlPrefixes[idx]) {
				chrome.pageAction.show(tabId);
				break;
			}
		}
	}
});
