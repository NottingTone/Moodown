"use strict";

(function(){

const iconTypes = {
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/pdf-24': 'PDF',
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/document-24': 'Word',
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/powerpoint-24': 'PPT',
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/spreadsheet-24': 'Excel',
	'http://moodle.nottingham.ac.uk/theme/image.php/nottingham_arts/core/1457712810/f/calc-24': 'Calc',
};

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
			console.log(match[2]);
			files.push({
				type: 'file',
				realUrl: match[1],
				icon: match[2],
				name: match[3],
				fileType: iconTypes[match[2]] || 'unknown',
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
