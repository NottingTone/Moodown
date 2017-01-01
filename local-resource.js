"use strict";

const MOODLE_HOST = 'moodle.nottingham.ac.uk';

const RES_CANCEL = Symbol('RES_CANCEL');
const RES_KEEP_PATH = Symbol('RES_KEEP_PATH');

const EXTERNAL_RESOURCE_URL = new Map([
	['https://js-agent.newrelic.com/nr-998.min.js', RES_CANCEL],
	// DO NOT LEAVE BLANK HERE
]);

const MOODLE_RESOURCE_PATH = new Map([
	['theme/jquery.php/core/jquery-1.11.0.min.js', RES_KEEP_PATH],
	['theme/jquery.php/theme_nottingham/jquery.backstretch-2.0.4.js', RES_KEEP_PATH],
	['theme/jquery.php/theme_nottingham/jquery.slides-3.0.4.js', RES_KEEP_PATH],
	/*
	// cache this file introduces an error
	['blocks/accessibility/userstyles.php', RES_KEEP_PATH],
	*/
	['pluginfile.php/1/theme_nottingham_science/schoolimages/12/unmc_fsci_compsci.jpg', 'images/unmc_fsci_compsci.jpg'],
	['pluginfile.php/1/theme_nottingham/campusimages/1/CN/IMG9267-1.jpg', 'images/IMG9267-1.jpg'],
	['theme/yui_combo.php?3.15.0/cssreset/cssreset-min.css&3.15.0/cssfonts/cssfonts-min.css&3.15.0/cssgrids/cssgrids-min.css&3.15.0/cssbase/cssbase-min.css', 'yui_combo/basic.css'],
	['theme/yui_combo.php?3.15.0/plugin/plugin-min.js&3.15.0/event-mousewheel/event-mousewheel-min.js&3.15.0/event-resize/event-resize-min.js&3.15.0/event-hover/event-hover-min.js&3.15.0/event-touch/event-touch-min.js&3.15.0/event-move/event-move-min.js&3.15.0/event-flick/event-flick-min.js&3.15.0/event-valuechange/event-valuechange-min.js&3.15.0/event-tap/event-tap-min.js', 'yui_combo/event.js'],
	['theme/yui_combo.php?3.15.0/stylesheet/stylesheet-min.js&3.15.0/datatype-xml-parse/datatype-xml-parse-min.js&3.15.0/io-xdr/io-xdr-min.js&3.15.0/io-form/io-form-min.js&3.15.0/io-upload-iframe/io-upload-iframe-min.js&3.15.0/queue-promote/queue-promote-min.js&3.15.0/io-queue/io-queue-min.js', 'yui_combo/data.js'],
	['theme/yui_combo.php?m/1477502187/block_navigation/navigation/navigation-min.js', 'yui_combo/navigation-min.js'],
	['theme/yui_combo.php?m/1477502187/theme_bootstrapbase/bootstrap/bootstrap-min.js', 'yui_combo/bootstrap-min.js'],
	['theme/yui_combo.php?rollup/3.15.0/yui-moodlesimple-min.css', 'yui_combo/yui-moodlesimple-min.css'],
	['theme/yui_combo.php?rollup/3.15.0_1/yui-moodlesimple-min.js&rollup/1477502187/mcore-min.js', 'yui_combo/mcore-min.js'],
	['theme/yui_combo.php?3.15.0/stylesheet/stylesheet-min.js', 'yui_combo/stylesheet-min.js'],
	['theme/yui_combo.php?m/1477502187/block_new_course_overview/mymodules/mymodules-min.js', 'yui_combo/mymodules-min.js'],
	['theme/yui_combo.php?3.15.0/tabview/assets/skins/sam/tabview.css', 'yui_combo/tabview.css'],
	['theme/yui_combo.php?3.15.0/arraylist/arrayli…0/node-focusmanager/node-focusmanager-min.js&3.15.0/tabview/tabview-min.js', 'focusmanager.tabview.js'],
	['theme/yui_combo.php?3.15.0/datatype-xml-pars…&3.15.0/queue-promote/queue-promote-min.js&3.15.0/io-queue/io-queue-min.js', 'queue-promote.io-queue.js'],
	['theme/yui_combo.php?3.15.0/stylesheet/stylesheet-min.js', 'yui_combo/stylesheet-min.js'],
	['theme/yui_combo.php?3.15.0/cssbutton/cssbutton-min.css', 'yui_combo/cssbutton-min.css'],
	['theme/yui_combo.php?3.15.0/event-mousewheel/event-mousewheel-min.js&3.15.0/event-resize/event-resize-min.js&3.15.0/event-hover/event-hover-min.js&3.15.0/event-touch/event-touch-min.js&3.15.0/event-move/event-move-min.js&3.15.0/event-flick/event-flick-min.js&3.15.0/event-valuechange/event-valuechange-min.js&3.15.0/event-tap/event-tap-min.js', 'yui_combo/event.js'],
	['theme/yui_combo.php?3.15.0/plugin/plugin-min.js&m/1477502187/core/lockscroll/lockscroll-min.js', 'yui_combo/plugin.lockscroll.js'],
	['theme/yui_combo.php?m/1477502187/core/lockscroll/lockscroll-min.js', 'yui_combo/plugin.lockscroll.js'],
	['theme/yui_combo.php?3.15.0/datatype-xml-parse/datatype-xml-parse-min.js&3.15.0/io-xdr/io-xdr-min.js&3.15.0/io-form/io-form-min.js&3.15.0/io-upload-iframe/io-upload-iframe-min.js&3.15.0/queue-promote/queue-promote-min.js&3.15.0/io-queue/io-queue-min.js', 'yui_combo/data.js'],
	['theme/yui_combo.php?3.15.0/arraylist/arraylist-min.js&3.15.0/widget-parent/widget-parent-min.js&3.15.0/widget-child/widget-child-min.js&3.15.0/tabview-base/tabview-base-min.js&3.15.0/event-simulate/event-simulate-min.js&3.15.0/async-queue/async-queue-min.js&3.15.0/gesture-simulate/gesture-simulate-min.js&3.15.0/node-event-simulate/node-event-simulate-min.js&3.15.0/node-focusmanager/node-focusmanager-min.js&3.15.0/tabview/tabview-min.js', 'yui_combo/arraylist___tabview.js'],
	['theme/yui_combo.php?m/1477502187/core/event/event-min.js&m/1477502187/filter_mathjaxloader/loader/loader-min.js', 'yui_combo/event.loader.js'],
	['theme/yui_combo.php?m/1477502187/theme_nottingham/fullscreen/fullscreen-min.js', 'yui_combo/fullscreen-min.js'],
	/*
	// cannot cross-domain redirect xhr
	['blocks/accessibility/styles/colour2.css', RES_KEEP_PATH],
	['blocks/accessibility/styles/colour3.css', RES_KEEP_PATH],
	['blocks/accessibility/styles/colour4.css', RES_KEEP_PATH],
	['blocks/accessibility/styles/colour5.css', RES_KEEP_PATH],
	*/
]);

const MOODLE_RESOURCE_REGEX = new Map([
	[/^theme\/image\.php\/\w+\/([^\/]*)\/\d+\/(.*)$/, 'theme/$1/$2'],
	[/^theme\/styles\.php\/\w+\/\d+\/(.*)$/, 'theme/$1.css'],
	[/^pluginfile\.php\/1\/theme_nottingham\/(.*)$$/, 'theme/theme_nottingham/$1'],
	[/^lib\/javascript\.php\/\d+\/(.*)$/, '$1'],
	[/^theme\/javascript\.php\/\w+\/\d+\/footer/, 'theme/javascript.php/footer.js'],
]);

function localPath2Redirect(localPath) {
	return {
		redirectUrl: chrome.extension.getURL(`res/${localPath}`),
	}
}

chrome.webRequest.onBeforeRequest.addListener((details) => {
	if (details.method === 'GET') {
		const localPath = EXTERNAL_RESOURCE_URL.get(details.url);
		if (localPath === RES_CANCEL) {
			return {
				cancel: true,
			};
		}
		if (typeof localPath === 'string') {
			return localPath2Redirect(localPath);
		}
	}
	return {};
}, { urls: Array.from(EXTERNAL_RESOURCE_URL.keys()) }, ['blocking']);

chrome.webRequest.onBeforeRequest.addListener((details) => {
	const path = details.url.slice(details.url.indexOf('://') + '://'.length + MOODLE_HOST.length + '/'.length);
	if (details.method === 'GET') {
		const localPath = MOODLE_RESOURCE_PATH.get(path);
		if (localPath === RES_CANCEL) {
			return { cancel: true };
		}
		if (localPath === RES_KEEP_PATH) {
			return localPath2Redirect(path);
		}
		if (typeof localPath === 'string') {
			return localPath2Redirect(localPath);
		}
		for (const [regex, repl] of MOODLE_RESOURCE_REGEX) {
			if (regex.test(path)) {
				return localPath2Redirect(path.replace(regex, repl));
			}
		}
	}
	return {};
}, { urls: [`*://${MOODLE_HOST}/*`] }, ['blocking']);
