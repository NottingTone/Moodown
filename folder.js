"use strict";

(function(){

const iconTypes = new Map([
	[/\/f\/pdf-24$/, 'PDF'],
	[/\/f\/document-24$/, 'Word'],
	[/\/f\/powerpoint-24$/, 'PPT'],
	[/\/f\/spreadsheet-24$/, 'Excel'],
	[/\/f\/calc-24$/, 'Calc'],
]);

function getFiletypeByIcon (icon) {
	for (let [iconPattern, filetype] of iconTypes) {
		if (iconPattern.test(icon)) {
			return filetype;
		}
	}
	return 'unknown';
}

window.getFolder = function(id) {
	return runner((function*() {
		let files = [];
		let resp = yield fetch(`http://moodle.nottingham.ac.uk/mod/folder/view.php?id=${id}`, { credentials: 'include' });
		let html = yield resp.text();
		let main = html.match(/<section id="region-main"[\s\S]*?<\/section>/)[0];
		let name = main.match('<h2>(.*?)</h2>')[1];
		let regexFile = /<a href="(http:\/\/moodle.nottingham.ac.uk\/pluginfile.php.*?)">[\s\S]*?<img.*?src="(.*?)" \/>[\s\S]*?<span class="fp-filename">(.*?)<\/span>/g;
		let match;
		while (match = regexFile.exec(main)) {
			files.push({
				type: 'file',
				realUrl: match[1],
				icon: match[2],
				name: match[3],
				fileType: getFiletypeByIcon(match[2]) || 'unknown',
			});
		}
		return {
			type: 'folder',
			name,
			icon: 'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/folder/1457712810/icon',
			id,
			files,
		};
	})());
};

})();
