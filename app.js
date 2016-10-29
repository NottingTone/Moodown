"use strict";

(function(){
Vue.config.devtools = true;

new Vue({
	el: '#app',
	data: {
		loading: 0,
		downloading: false,
		downloadedFiles: 0,
		tree: null,
		filetypes: [{
			id: 'pdf',
			name: 'PDF',
			number: 0,
			checked: true,
		}, {
			id: 'doc',
			name: 'Document',
			number: 0,
			checked: true,
		}, {
			id: 'slides',
			name: 'Slides',
			number: 0,
			checked: true,
		}, {
			id: 'spreadsheet',
			name: 'Spreadsheet',
			number: 0,
			checked: true,
		}, {
			id: 'calc',
			name: 'Calc',
			number: 0,
			checked: true,
		}, {
			name: 'Unknown',
			number: 0,
			checked: false,
		}],
		filterTypes: [{
			id: 'string',
			name: 'String',
		}, {
			id: 'wildcard',
			name: 'Wildcard',
		}, {
			id: 'regex',
			name: 'RegEx',
		}],
		filter: {
			type: 'wildcard',
			pattern: '',
		},
	},
	computed: {
		totalFiles() {
			return this.filetypes.filter(x => x.checked).map(x => x.number).reduce((x, y) => x + y, 0);
		},
		pattern() {
			switch (this.filter.type) {
				case 'string':
					return new RegExp(escapeRegExp(this.filter.pattern), 'i');
					break;
				case 'wildcard':
					return new RegExp(escapeRegExp(this.filter.pattern).replace(/\\\*/g, '.*').replace(/\\\?/g, '.'), 'i');
					break;
				case 'regexp':
					try {
						return new RegExp(this.filter.pattern, 'i');
					} catch (e) {
						return /$^/; // match nothing
					}
					break;
				default:
					return /$^/;
			}
		},
	},
	methods: {
		addFiles(filetypeId, number) {
			for (const filetype of this.filetypes) {
				if (filetype.id === filetypeId) {
					filetype.number += number;
					break;
				}
			}
		},
		startLoading() {
			++this.loading;
		},
		stopLoading() {
			this.loading && --this.loading;
		},
		download: co.wrap(function*() {
			this.downloadedFiles = 0;
			this.downloading = true;
			this.startLoading();
			yield this.$refs.fileList.download();
			this.stopLoading();
			chrome.downloads.showDefaultFolder();
			this.downloading = false;
		}),
		addDownloaded(n) {
			this.downloadedFiles += n;
		},
	},
	created() {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			let currentTab = tabs[0];
			let match;
			if (match = currentTab.url.match(/^http:\/\/moodle.nottingham.ac.uk\/mod\/folder\/view\.php\?id=(\d+)$/)) {
				this.startLoading();
				let id = match[1];
				getFolder(id)
				.then((folder) => {
					initComponents({
						name: `Folder - ${folder.name}`,
						type: 'dir',
						files: [folder],
					});
					this.stopLoading();
				});
			} else if (currentTab.url.startsWith('http://moodle.nottingham.ac.uk/course/view.php?id=')) {
				this.startLoading();
				chrome.tabs.sendMessage(tabs[0].id, 'requestData', (response) => {
					this.tree = response;
					this.stopLoading();
				});
			}
		});
	},
});

function escapeRegExp(str) {
	return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

})();
