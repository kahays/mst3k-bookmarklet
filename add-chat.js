if (!$("#tlkio").length) {
	/* Ad-hoc, best guess for now. */
	var chatroom = document.location.pathname.replace(/^\/\d*/, 'MST3k');

	/* Create chatroom container. */
	$("#posts")
	  .prepend('<div id="chat"><div id="tlkio" data-channel="' + chatroom + '" style="overflow: auto; width: 100%; height: 1000px;"></div></div>');

	/* Create tab. */
	$('<a href="#" id="chat_tab">Chat</a>')
	  /* Hack to add onClick to the new tab. This is based on the function from the (minified) application.js powering MST3K. */
	  .click(function(e){
		var t = e.target.id;
		$("#tab_bar a").removeClass("active");
		$("#tab_bar a#" + t).addClass("active");
		t = t.substr(0, t.length-4);
		$("#posts").children().not("#" + t).hide();
		$("#posts").children("#" + t).show();
		return false;
	  })
	  .prependTo("#tab_bar")
	  .click();

	/*
	** Hack! Tlk.io's embed only expects to fire on page load. We assume it's already
	** loaded, so we use a highly nonstandard hack to fire just that event listener.
	** The long-term solution is to get them to use document.readyState to determine
	** if a page is already loaded.
	*/
	var totalUnrelatedEventListeners = getEventListeners(window).load.length;
	$.getScript("http://tlk.io/embed.js");
	(function fireWhenReady() {
		var listeners = getEventListeners(window).load;
		if (listeners.length === totalUnrelatedEventListeners) {
			setTimeout(fireWhenReady, 50);
			return;
		} else {
			(listeners[listeners.length-1].listener)();
		}
	})();
}
