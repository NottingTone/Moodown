"use strict";

(function(){

	// polyfille for Chrome 50-
	NodeList.prototype[Symbol.iterator] = NodeList.prototype[Symbol.iterator] || Array.prototype[Symbol.iterator];
	HTMLCollection.prototype[Symbol.iterator] = HTMLCollection.prototype[Symbol.iterator] || Array.prototype[Symbol.iterator];

})();
