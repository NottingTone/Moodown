"use strict";

(function(){

let data;
let pattern;
let filetypes = {
	'Word': { number: 0 },
	'PDF': { number: 0 },
	'PPT': { number: 0 },
	'Excel': { number: 0 },
	'unknown': { number: 0 },
	'Total': { number: 0 },
};

function getFileListElement(files) {
	let ul = document.createElement('ul');
	ul.classList.add('files');
	for (let file of files) {
		switch (file.type) {
			case 'dir':
			case 'folder':
				ul.appendChild(getDirElement(file));
				break;
			case 'file':
				ul.appendChild(getFileElement(file));
				break;
		}
	}
	return ul;
}

function getDirElement(dir) {
	let li = document.createElement('li');
	li.classList.add('dir');
	let header = getHeaderElement(dir);
	header.appendChild(getSwitchElement(dir));
	let checkbox = getCheckBoxElement(dir);
	if (!dir.files) {
		checkbox.disabled = true;
	}
	header.appendChild(checkbox);
	header.appendChild(getIconElement(dir));
	let indent = getIndentElement(dir);
	indent.appendChild(getNameElement(dir));
	indent.appendChild(getDirnumElement(dir));
	header.appendChild(indent);
	li.appendChild(header);
	if (dir.files) {
		li.appendChild(getFileListElement(dir.files));
	}
	dir.el = li;
	return li;
}

function getFileElement(file) {
	let li = document.createElement('li');
	li.classList.add('file');
	let header = getHeaderElement(file);
	header.appendChild(getCheckBoxElement(file));
	header.appendChild(getIconElement(file));
	let indent = getIndentElement(file);
	indent.appendChild(getNameElement(file));
	header.appendChild(indent);
	li.appendChild(header);
	file.el = li;
	return li;
}

function getHeaderElement(file) {
	let header = document.createElement('div');
	header.classList.add('header');
	return header;
}

function getSwitchElement(dir) {
	let switchEl = document.createElement('div');
	switchEl.classList.add('switch');
	switchEl.addEventListener('click', onSwitch);
	return switchEl;
}

function getCheckBoxElement(file) {
	let checkbox = document.createElement('input');
	checkbox.type = 'checkbox';
	checkbox.classList.add('check');
	checkbox.addEventListener('change', onCheck);
	return checkbox;
}

function getIconElement(file) {
	let icon = document.createElement('div');
	icon.classList.add('icon');
	icon.style.backgroundImage = `url(${file.icon})`;
	return icon;
}

function getIndentElement (file) {
	let div = document.createElement('div');
	div.classList.add('indent');
	return div;
}

function getNameElement(file) {
	let span = document.createElement('span');
	span.classList.add(file.type === 'file' ? 'filename' : 'dirname');
	span.textContent = file.name;
	return span;
}

function getDirnumElement(dir) {
	let span = document.createElement('span');
	span.classList.add('dirnum');
	span.textContent = `(0/${dir.files ? dir.files.length : '0+'})`;
	return span;
}

function onSwitch (e) {
	this.classList.toggle('open');
	this.parentNode.nextSibling.classList.toggle('open');
}

function onCheck (e) {
	let checked = this.checked;
	setChecked(this.parentNode.parentNode, checked);
	update();
}

function setChecked(li, checked) {
	if (li.classList.contains('file')) {
		li.querySelector('.header>input[type=checkbox]').checked = checked;
	} else if (li.classList.contains('dir')) {
		let files = li.querySelector('.files');
		if (files) {
			li.querySelector('.header>input[type=checkbox]').checked = checked;
			for (let child of files.childNodes) {
				setChecked(child, checked);
			}
		}
	}
}

function escapeRegExp(str) {
	return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

function onFilterChange() {
	let patternStr = document.getElementById('filter-pattern').value;
	switch (document.getElementById('filter-type').value) {
		case 'string':
			pattern = new RegExp(escapeRegExp(patternStr), 'i');
			break;
		case 'wildcard':
			pattern = new RegExp(escapeRegExp(patternStr).replace(/\\\*/g, '.*').replace(/\\\?/g, '.'), 'i');
			break;
		case 'regexp':
			try {
				pattern = new RegExp(patternStr, 'i');
			} catch (e) {
				return;
			}
			break;
	}
	update();
}

function update() {
	for (let filetype in filetypes) {
		filetypes[filetype].number = 0;
	}
	updateFileTree(data);
	updateFiletypes();
}

function updateFileTree(file) {
	if (file.type === 'file') {
		if (pattern.test(file.name)) {
			file.el.classList.remove('hidden');
			if (file.el.querySelector('.header>.check').checked) {
				++filetypes[file.fileType].number;
				return [1, 1];
			} else {
				return [0, 1];
			}
		} else {
			file.el.classList.add('hidden');
			file.el.querySelector('.header>.check').checked = false;
			return [0, 0, false];
		}
	} else if (!file.files) {
		return [0, 0, true];
	} else {
		let dirnum = [0, 0, false];
		for (let f of file.files) {
			let num = updateFileTree(f, pattern);
			dirnum[0] += num[0];
			dirnum[1] += num[1];
			dirnum[2] |= num[2];
		}
		if (file.el) {
			if (dirnum[1] || dirnum[2]) {
				file.el.classList.remove('hidden');
			} else {
				file.el.classList.add('hidden');
			}
			let dirnumEl = file.el.querySelector('.header>.indent>.dirnum');
			dirnumEl.textContent = `(${dirnum[0]}/${dirnum[2] ? dirnum[1] + '+' : dirnum[1]})`;
			let check = file.el.querySelector('.header>.check');
			check.checked = dirnum[0] && dirnum[0] === dirnum[1];
			check.indeterminate = dirnum[0] && dirnum[0] < dirnum[1];
			check.disabled = !dirnum[1];
		}
		return dirnum;
	}
}

function updateFiletypes() {
	let sum = 0;
	for (let filetype in filetypes) {
		if (filetype !== 'Total') {
			let el = filetypes[filetype].el;
			el.textContent = filetypes[filetype].number;
			if (el.parentNode.querySelector('td>input[type=checkbox]').checked) {
				sum += filetypes[filetype].number;
			}
		}
	}
	filetypes['Total'].el.textContent = sum;
}

function initFileTypes() {
	let tbody = document.getElementById('filetypes');
	for (let filetype in filetypes) {
		let tr = document.createElement('tr');
		let td0 = document.createElement('td');
		if (filetype !== 'Total') {
			let checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.checked = filetype !== 'unknown';
			checkbox.addEventListener('change', updateFiletypes);
			td0.appendChild(checkbox);
		}
		let td1 = document.createElement('td');
		td1.textContent = filetype;
		let td2 = document.createElement('td');
		td2.textContent = '0';
		tr.appendChild(td0);
		tr.appendChild(td1);
		tr.appendChild(td2);
		tbody.appendChild(tr);
		filetypes[filetype].el = td2;
	}
}

function safeFilename(filename) {
	return filename.replace(/[^a-zA-Z0-9_\-\.]+/g, '_');
}

function chromeDownload(url, path, first) {
	let filename = url.slice(url.lastIndexOf('/') + 1);
	filename = decodeURIComponent(filename);
	chrome.downloads.download({
		url,
		filename: path + filename
	});
	if (first.first) {
		first.first = false;
		chrome.downloads.showDefaultFolder();
	}
}

function downloadFile(id, path, first) {
	return new Promise((resolve, reject) => {
		let url = `http://moodle.nottingham.ac.uk/mod/resource/view.php?id=${id}`;
		fetch(url, {
			method: 'HEAD',
			credentials: 'include',
		}).then((resp) => {
			if (resp.url.startsWith('http://moodle.nottingham.ac.uk/pluginfile.php')) {
				chromeDownload(resp.url, path, first);
				resolve();
			} else if (resp.url === url) {
				fetch(url, { credentials: 'include' })
				.then((resp) => {
					return resp.text();
				}).then((text) => {
					let match = text.match(/<div class="resourceworkaround">Click <a href="(.*?)"/);
					if (match) {
						chromeDownload(match[1], path, first);
						resolve();
					} else {
						reject();
					}
				}).catch(reject);
			} else {
				reject();
			}
		}).catch(reject);
	});
}

function download(file, path, extendPath = false, first) {
	if (file.type === 'file') {
		let fileCheck = file.el.querySelector('.header>.check');
		let filetypeCheck = filetypes[file.fileType].el.parentNode.querySelector('td>input[type=checkbox]');
		if (fileCheck.checked && filetypeCheck.checked) {
			downloadFile(file.id, path, first);
		}
	} else {
		if (file.files) {
			let sum = 0;
			for (let f of file.files) {
				let checkbox = f.el.querySelector('.header>.check');
				if (checkbox.checked || checkbox.indeterminate) {
					++sum;
				}
			}
			for (let f of file.files) {
				let newPath = path;
				if (extendPath) {
					newPath += safeFilename(file.name) + '/';
				}
				download(f, newPath, sum > 1, first);
			}
		}
	}
}

function go() {
	let first = {first: true};
	download(data, `Moodown_${formatTime()}/`, false, first);
}

function pad(num, digits) {
	let s = num.toString();
	while (s.length < digits) {
		s = '0' + s;
	}
	return s;
}

function formatTime() {
	let dt = new Date();
	let yr = dt.getFullYear();
	let mo = pad(dt.getMonth() + 1, 2);
	let date = pad(dt.getDate(), 2);
	let hr = pad(dt.getHours(), 2);
	let min = pad(dt.getMinutes(), 2);
	let sec = pad(dt.getSeconds(), 2);
	let ms = pad(dt.getMilliseconds(), 3)
	return `${yr}${mo}${date}${hr}${min}${sec}${ms}`;
}

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
	chrome.tabs.sendMessage(tabs[0].id, "requestData", function (response) {

		data = response;
		document.getElementById('title').textContent = data.module;
		initFileTypes();
		let fileListEl = getFileListElement(data.files);
		fileListEl.classList.add('open');
		document.getElementById('files').appendChild(fileListEl);
		onFilterChange();

		document.getElementById('filter-type').addEventListener('change', onFilterChange)
		document.getElementById('filter-pattern').addEventListener('input', onFilterChange);
		document.getElementById('go').addEventListener('click', go);

	});
});


})();