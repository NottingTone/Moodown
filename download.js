"use strict";

(function(){

function chromeDownload(url, path) {
	return new Promise((resolve, reject) => {
		let filename = url.slice(url.lastIndexOf('/') + 1);
		if (filename.indexOf('?') !== -1) {
			filename = filename.slice(0, filename.indexOf('?'));
		}
		filename = decodeURIComponent(filename);
		chrome.downloads.download({
			url,
			filename: path + filename
		}, (downloadId) => {
			if (downloadId) {
				resolve(downloadId);
			} else {
				reject();
			}
		});
	});
}

function downloadFile(id, path) {
	return runner((function*() {
		let url = `http://moodle.nottingham.ac.uk/mod/resource/view.php?id=${id}`;
		let resp = yield fetch(url, {
			method: 'HEAD',
			credentials: 'include',
		});
		if (resp.url.startsWith('http://moodle.nottingham.ac.uk/pluginfile.php')) {
			yield chromeDownload(resp.url, path);
		} else if (resp.url === url) {
			resp = yield fetch(url, { credentials: 'include' });
			let text = yield resp.text();
			let match = text.match(/<div class="resourceworkaround">Click <a href="(.*?)"/);
			if (match) {
				yield chromeDownload(match[1], path);
			} else {
				throw Error('Unknown page content');
			}
		} else {
			throw Error('Unknown redirection')
		}
	})());
}

window.downloadFilesInList = function(filelist) {
	return runner((function*() {
		let button = document.getElementById('go');
		button.disabled = true;
		button.textContent = `0/${filelist.length}`;
		for (let idx in filelist) {
			if (filelist[idx].realUrl) {
				yield chromeDownload(filelist[idx].realUrl, filelist[idx].path);
			} else {
				yield downloadFile(filelist[idx].id, filelist[idx].path);
			}
			button.textContent = `${+idx+1}/${filelist.length}`;
		}
		chrome.downloads.showDefaultFolder();
		button.disabled = false;
		button.textContent = 'Go!';
	})());
}

})();
