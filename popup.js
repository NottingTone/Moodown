"use strict";

(function(){

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
	chrome.tabs.sendMessage(tabs[0].id, "requestData", function (response) {

		initComponents(response);

	});
});

})();