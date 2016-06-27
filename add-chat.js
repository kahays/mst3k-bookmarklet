(function(){
	if (!$("#tlkio").length) {
		/* Ad-hoc, best guess for now. 30-character limit on chat room names. */
		var chatroom = document.location.pathname.replace(/^(.*\d+)/, 'MST3k').substr(0, 30);

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
		** loaded, so we re-fire the load event. The long-term solution is to get them to
		** use document.readyState to determine if a page is already loaded.
		*/
		$.getScript("http://tlk.io/embed.js", function(){
			/* Until Edge, IE doesn't support the Event() syntax. */
			try
			{
				var e = new Event('load');
			}
			catch(x)
			{
				var e = document.createEvent("Event");
				e.initEvent("load", true, true);
			}
			window.dispatchEvent(e);
		});
	}
})();
