/*
** Metacafe $(".link embed")
** YouTube, Vimeo, Dailymotion $(".link iframe")
** TODO: unified player interface
**	all we use of the APIs is getDuration(), seek() and play()
*/

/* Discover which APIs to load. */
var necessaryAPIs =	$(".link > p > *")
			  .toArray()
			  .map(videoSite)
			  .filter(unique)
			  /* Metacafe has no API for now. */
			  .filter(function(s){ return s != "metacafe"; });
console.log(necessaryAPIs);

/* Set up callback to attach APIs once the APIs are loaded. */
var waitForAPIs = onYouTubeIframeAPIReady = dmAsyncInit = jumpstarter(necessaryAPIs.length, attachAPIs);

/* Set up callback to initialize UI and content once the APIs are attached. */
var waitForAttachedAPIs = jumpstarter(getVideoFrames().length, initialize);

/* Kick it off: load APIs. */
necessaryAPIs.forEach(loadAPI);

function loadAPI(site)
{
	if (site === "youtube")
	{
		if (!window['YT'])
		{
			$.getScript("https://www.youtube.com/iframe_api");
		}
		else
		{
			waitForAPIs();
		}
	}
	else if (site === "vimeo")
	{
		if (!window['Froogaloop'])
		{
			$.getScript("https://f.vimeocdn.com/js/froogaloop2.min.js");
		}
		/* Worry about race conditions later. */
		waitForAPIs();
	}
	else if (site === "dailymotion")
	{
		if (!window['DM'])
		{
			$.getScript("http://api.dmcdn.net/all.js");
		}
		else
		{
			waitForAPIs();
		}
	}
}

function attachAPIs()
{
	// For each video frame
	for (var i = 0, videos = $(".link > p > *"); i < videos.length; ++i)
	{
		var site = videoSite(videos[i]);

		/* Skip Metacafe videos until we can find an API. */
		if (site === "metacafe")
		{
			waitForAttachedAPIs();
			continue;
		}

		// reload video with API support
		makeVideoAPICapable(videos[i], site);

		// attach API via player
		attachPlayer(videos[i], site);
	}
}

function attachPlayer(video, site)
{
	if (video.player)
	{
		return;
	}

	if (site === "youtube")
	{
		video.player = new YT.Player(video, {
			events: {
				onReady: function(event) {
					var player = event.target;
					player.play = player.playVideo;
					waitForAttachedAPIs();
				}
			}
		});
	}
	else if (site === "vimeo")
	{
		video.player = Froogaloop(video);
		video.player.addEvent("ready", waitForAttachedAPIs);
	}
	else if (site === "dailymotion")
	{
		/* Ad-hoc. */
		var id = video.src.replace(/.*\//, "");

		/* No assignment needed, because the whole player is dropped in where the element is. */
		DM.player(video, {
			width: 640,
			height: 480,
			video: id,
			events: {
				apiready: function(event) {
					var frame = event.target;
					frame.player = frame;
					frame.player.seekTo = frame.seek;
					frame.player.getDuration = function(){ return frame.duration; };
					waitForAttachedAPIs();
				}
			}
		});
	}
}

function makeVideoAPICapable(video, site)
{
	var apiString = "", originString = "";

	switch(site)
	{
		case "youtube":		apiString = "enablejsapi=1";
					originString = "origin=" + window.location.origin;
					break;
		case "vimeo":		apiString = "api=1";
					originString = "";
					break;
		/*
		case "dailymotion":	apiString = "api=postmessage";
					originString = "origin=" + window.location.origin;
					break;
		*/
	}

	var newSrc = video.src;
	if (newSrc.indexOf(apiString) === -1)
	{
		newSrc += (newSrc.indexOf("?") === -1 ? "?" : "&" ) + apiString;
	}
	if (newSrc.indexOf(originString) === -1)
	{
		newSrc += (newSrc.indexOf("?") === -1 ? "?" : "&" ) + originString;
	}

	/* Only reload if we have to. */
	if (video.src !== newSrc)
	{
		video.src = newSrc;
	}
}

function videoSite(element)
{
	var url = element.src;
	if (/^https?:\/\/www.youtube.com/.test(url))
	{
		return "youtube";
	}
	else if (/^https?:\/\/player.vimeo.com/.test(url))
	{
		return "vimeo";
	}
	else if (/^https?:\/\/www.dailymotion.com/.test(url))
	{
		return "dailymotion";
	}
	else if (/^https?:\/\/www.metacafe.com/.test(url))
	{
		return "metacafe";
	}
	else
	{
		return "unknown";
	}
}

// Set up UI
// Load and execute theater mode and watch-it-together code

function initialize()
{
	/* Load the custom MST3K stylesheet. */
	var style = document.createElement("link");
	style.href = "http://localhost/~kate/style.css";
	style.rel = "stylesheet";
	style.type = "text/css";
	document.head.appendChild(style);

	if (!$("#user-content").size())
	{
		/* Collect the various sections into groupings. */
		$("#user_bar, .function_bar").wrapAll("<div id='tool-header'/>");
		$("#info_bar, #tab_bar, #posts").wrapAll("<div id='user-content'/>");
		$("#content > :not(#tool-header, #user-content)").wrapAll("<div id='video-content'/>");

		/* Add control button. */
		var uiControl = $("<label><input type='checkbox' value='?'> Theater mode</label>")
		  .prop('id', 'theater-mode')
		  .insertAfter("h2"); /* Insert after movie title, so it'll settle near the table. */
	}

	if (!$("#embed-wrapper").size())
	{
		/* Make it easier to keep the message box on top. */
		$(".link").wrapAll("<div id='embed-wrapper'/>");

		/* Set up relative positioning for messages later on. */
		$("#embed-wrapper").css('position', 'relative');

		/* Add control button. */
		$("<a>Watch it together</a>")
		  .prop('id', 'watch-it-together')
		  .prop('href', '#')
		  .insertAfter("h2"); /* Insert after movie title, so it'll settle near the table. */

		/* Set up the messaging box. */
		$("<a>")
		  .prop('id', 'message-box')
		  .prop('href', '#')
		  .appendTo("#embed-wrapper");
	}

	/* Load other scripts. */
	$.getScript("http://localhost/~kate/theater-mode.js");
	$.getScript("http://localhost/~kate/watch-it-together.js");
}

/* UTILITY FUNCTIONS */

function getVideoFrames()
{
	return $(".link iframe");
}

function jumpstarter(totalCount, callback)
{
	return function() {
		this.count = (this.count ? this.count + 1 : 1);

		if (this.count === totalCount)
		{
			callback();
		}
	};
}

/* From http://stackoverflow.com/questions/1960473/unique-values-in-an-array . Thanks!*/
function unique(value, index, self)
{
	return self.indexOf(value) === index;
}
