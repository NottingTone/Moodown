"use strict";

(function(){

const iconTypes = new Map([
	[/\/f\/pdf-24$/, 'pdf'],
	[/\/f\/document-24$/, 'doc'],
	[/\/f\/powerpoint-24$/, 'slides'],
	[/\/f\/spreadsheet-24$/, 'spreadsheet'],
	[/\/f\/calc-24$/, 'calc'],
]);

const extensionTypes = new Map([
	['pdf', 'pdf'],
	['doc', 'doc'],
	['ppt', 'slides'],
	['pptx', 'slides'],
	['xls', 'spreadsheet'],
	['xlsx', 'spreadsheet'],
	['zip', 'archive'],
	['7z', 'archive'],
	['rar', 'archive'],
	['gz', 'archive'],
]);

function getFiletypeByIcon(icon) {
	for (let [iconPattern, filetype] of iconTypes) {
		if (iconPattern.test(icon)) {
			return filetype;
		}
	}
	return 'other';
}

function getFiletypeByExtension(extension) {
	if (extensionTypes.has(extension)) {
		return extensionTypes.get(extension);
	} else {
		return 'other';
	}
}

function safeFilename(filename) {
	return filename
		.replace(/\s+/g, ' ')
		.replace(/[\\\/\0<>:"\|\?\*]+/g, '_');
}

function chromeDownload(url, path, name) {
	return new Promise((resolve, reject) => {
		let filename = url.slice(url.lastIndexOf('/') + 1);
		if (filename.indexOf('?') !== -1) {
			filename = filename.slice(0, filename.indexOf('?'));
		}
		filename = decodeURIComponent(filename).trim();
		if (!filename) {
			filename = name;
		}
		chrome.downloads.download({
			url,
			filename: path + filename,
			conflictAction: 'overwrite',
		}, (downloadId) => {
			if (downloadId) {
				resolve(downloadId);
			} else {
				reject();
			}
		});
	});
}

function parseFolder(node) {
	const filenameIcon = node.querySelector('.fp-filename-icon');
	const icon = filenameIcon.querySelector('.fp-icon>img').src;
	const name = filenameIcon.querySelector('.fp-filename').textContent;
	let type, url, children, fetched, filetype;
	if (filenameIcon.tagName === 'SPAN') {
		type = 'file';
		url = filenameIcon.querySelector('a[href]').href;
		filetype = getFiletypeByIcon(icon) || 'other';
	} else {
		type = 'dir';
		fetched = true;
		children = [];
		const childrenNodes = node.querySelector('.fp-filename-icon~ul');
		if (childrenNodes) {
			for (const child of childrenNodes.childNodes) {
				if (child.nodeType === 1 && child.tagName === 'LI') {
					children.push(parseFolder(child))
				}
			}
		}
	}
	return JSON.parse(JSON.stringify({
		type,
		name,
		icon,
		url,
		children,
		fetched,
		filetype,
	}));
}

Vue.nextTickPromise = function() {
	return new Promise((resolve, reject) => {
		Vue.nextTick(resolve);
	});
}

Vue.component('file-list', {
	template: '#file-list',
	props: {
		node: Object,
	},
	data() {
		return {
			checked: false,
			expanded: this.node.type === 'root',
			selectedFiles: 0,
			shownFiles: 0,
			unfetchedDirs: 0,
		};
	},
	methods: {
		addSelectedFiles(n) {
			this.selectedFiles += n;
			if (this.$parent !== this.$root) {
				return this.$parent.addSelectedFiles(n);
			}
		},
		addShownFiles(n) {
			this.shownFiles += n;
			if (this.$parent !== this.$root) {
				return this.$parent.addShownFiles(n);
			}
		},
		addUnfetchedDirs(n) {
			this.unfetchedDirs += n;
			if (this.$parent !== this.$root) {
				return this.$parent.addUnfetchedDirs(n);
			}
		},
		updateShownFiles() {
			const shownFiles = this.$root.pattern.test(this.node.name) ? 1 : 0;
			if (this.checked) {
				this.$root.addFiles(this.node.filetype, shownFiles - this.shownFiles);
				this.addSelectedFiles(shownFiles - this.shownFiles);
			}
			this.addShownFiles(shownFiles - this.shownFiles);
		},
		updateChecked() {
			this.checked = this.selectedFiles === this.shownFiles;
			if (this.$parent.node.type !== 'root') {
				return this.$parent.updateChecked();
			}
		},
		onCheck: co.wrap(function*() {
			yield this.setCheck(this.checked);
			if (this.$parent.node.type !== 'root') {
				this.$parent.updateChecked();
			}
		}),
		setCheck: co.wrap(function*(checked) {
			if (this.node.type === 'file') {
				this.addSelectedFiles(checked ? 1 : -1);
				this.$root.addFiles(this.node.filetype, checked ? 1 : -1);
			} else {
				if (!this.node.fetched) {
					yield this.fetch();
				}
				yield Vue.nextTickPromise();
				for (const child of this.$children) {
					if (child.unfetchedDirs || child.shownFiles && child.checked !== checked) {
						child.checked = checked;
						yield child.setCheck(checked, false);
					}
				}
			}
		}),
		fetch: co.wrap(function*() {
			this.$root.startLoading();
			const children = [];
			const resp = yield fetch(`http://moodle.nottingham.ac.uk/mod/folder/view.php?id=${this.node.id.split('-')[1]}`, { credentials: 'include' });
			const html = yield resp.text();
			const main = html.match(/<div id="folder_tree0" class="filemanager"><ul><li>([\s\S]*?)<\/div><div class="box generalbox folderbuttons">/)[1];
			const node = document.createElement('div');
			node.innerHTML = main;
			const folder = parseFolder(node);
			const name = html.match('<h2>(.*?)</h2>')[1];
			if (!this.node.name) {
				this.node.name = name;
			}
			this.node.fetched = true;
			this.node.children = folder.children;
			this.addUnfetchedDirs(-1);
			this.$root.stopLoading();
		}),
		download: co.wrap(function*(path) {
			if (!this.selectedFiles) {
				return;
			}
			if (this.node.type === 'file') {
				if (this.$root.filetypes.some(x => x.id === this.node.filetype && x.checked)) {
					if (!this.node.url) {
						yield this.getUrl();
					}
					yield chromeDownload(this.node.url, path, this.node.name);
					this.$root.addDownloaded(1);
				}
			} else {
				for (const child of this.$children) {
					yield child.download(`${path || ''}${safeFilename(this.node.name)}/`);
				}
			}
		}),
		getUrl: co.wrap(function*() {
			const [type, id] = this.node.id.split('-');
			let url, resp;
			switch (type) {
			case 'resource':
				url = `http://moodle.nottingham.ac.uk/mod/resource/view.php?id=${id}`;
				resp = yield fetch(url, {
					method: 'HEAD',
					credentials: 'include',
				});
				if (resp.url.startsWith('http://moodle.nottingham.ac.uk/pluginfile.php')) {
					this.node.url = resp.url;
				} else if (resp.url === url) {
					const resp = yield fetch(url, { credentials: 'include' });
					const text = yield resp.text();
					const match = text.match(/Click <a href="(http:\/\/moodle.nottingham.ac.uk\/pluginfile.php.*?)"[\s\S]*?<\/a> link to view the file/);
					if (match) {
						this.node.url = match[1];
					} else {
						throw Error('Unknown page content');
					}
				} else {
					throw Error('Unknown redirection');
				}
				break;
			case 'equella':
				url = `http://moodle.nottingham.ac.uk/mod/equella/view.php?id=${id}`;
				resp = yield fetch(url, {
					method: 'HEAD',
					credentials: 'include',
				});
				if (resp.url.startsWith('https://equella.nottingham.')) {
					this.node.url = resp.url;
				} else if (resp.url === url) {
					const resp = yield fetch(url, { credentials: 'include' });
					const text = yield resp.text();
					const match = text.match(/Click <a href="(https:\/\/equella.nottingham.*?)"[\s\S]*?<\/a> link to open resource/);
					if (match) {
						this.node.url = match[1];
					} else {
						throw Error('Unknown page content');
					}
				} else {
					throw Error('Unknown redirection');
				}
				break;
			default:
				throw Error('Unknown file');
			}
		}),
	},
	created() {
		if (this.node.type === 'file') {
			this.updateShownFiles();
			this.$root.$watch('pattern', () => {
				this.updateShownFiles();
			});
		} else if (this.node.type === 'dir') {
			if (!this.node.fetched) {
				this.addUnfetchedDirs(1);
			}
		}
	},
	watch: {
		expanded() {
			if (!this.node.fetched) {
				return this.fetch();
			} else {
				return Promise.resolve();
			}
		},
	},
});

})();