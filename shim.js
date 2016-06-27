(function(theaterModeOnly, developmentEnvironment){
	if (theaterModeOnly)
	{
		initialize(theaterModeOnly);
	}
	else
	{
		prepareWatchItTogetherVideos();
	}

	function prepareWatchItTogetherVideos()
	{
		/* Discover which APIs to load. */
		var necessaryAPIs =	getVideoFrames()
					  .toArray()
					  .map(videoSite)
					  /* From http://stackoverflow.com/questions/1960473/unique-values-in-an-array . Thanks!*/
					  .filter(function unique(value, index, self){ return self.indexOf(value) === index; });

		/* Set up callback to attach APIs once the APIs are loaded. */
		var waitForAPIs = onYouTubeIframeAPIReady = dmAsyncInit = jumpstarter(attachAPIs, necessaryAPIs.length);

		/* Set up callback to initialize UI and content once the APIs are attached. */
		var waitForAttachedAPIs = jumpstarter(initialize, getVideoFrames().length);

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
				/*
				** Froogaloop provides no callback for when it's finished loading, so we hack it
				** by fetching the script only once but calling our load function repeatedly until
				** Froogaloop is seen to exist.
				*/
				if (!window['Froogaloop'])
				{
					if (!loadAPI['FroogaloopLoading'])
					{
						$.getScript("https://f.vimeocdn.com/js/froogaloop2.min.js");
						loadAPI['FroogaloopLoading'] = true;
					}
					setTimeout(loadAPI, 50, "vimeo");
				}
				else
				{
					waitForAPIs();
				}
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
			else
			{
				/* Other sites, including Metacafe, are assumed to have no player API. */
				waitForAPIs();
			}
		}

		function attachAPIs()
		{
			for (var i = 0, videos = getVideoFrames(); i < videos.length; ++i)
			{
				var site = videoSite(videos[i]);

				/* Reload video with API support. */
				makeVideoAPICapable(videos[i], site);

				/* Attach API via player. */
				attachPlayer(videos[i], site);
			}
		}

		function attachPlayer(video, site)
		{
			if (video.player)
			{
				waitForAttachedAPIs();
				return;
			}

			video.errorDescription = "";
			if (site === "youtube")
			{
				video.player = new YT.Player(video, {
					events: {
						onReady: function(event) {
							var player = event.target;
							player.play = player.playVideo;
							/*
							** HACK: if a YouTube video doesn't exist, it'll have a duration of zero. The
							** long-term solution is to actually use the YouTube Data API, which requires
							** an API key from Google.
							*/
							if (player.getDuration() === 0)
							{
								video.player = null;
								video.errorDescription = "The YouTube video may not exist.";
							}
							waitForAttachedAPIs();
						}
					}
				});
			}
			else if (site === "vimeo")
			{
				video.player = Froogaloop(video);
				video.player.addEvent("ready", function() {
					video.player.seekTo = function(time){ video.player.api("seekTo", time); };
					video.player.play = function(){ video.player.api("play"); };
					video.player.api("getDuration", function(duration){
						video.player.getDuration = function(){ return duration; };
						/*
						** Moving inside to try and prevent a race condition where watch-it-together
						** /seems to/ try to access getDuration() before it exists.
						*/
						waitForAttachedAPIs();
					});
				});
			}
			else if (site === "dailymotion")
			{
				/* Ad-hoc. */
				var id = video.src.replace(/.*\//, "");

				/* The duration is typically not loaded until the video is played, but we need it beforehand, and so use the data API. */
				var preloadDuration = NaN;
				DM.api('/video/' + id + '?fields=duration,owner.screenname', function(response)
				{
					preloadDuration = response.duration;

					/* No assignment needed, because the whole player is dropped in where the element is. */
					DM.player(video, {
						width: 640,
						height: 480,
						video: id,
						params: {
							api: 1,
							autoplay: 0
						},
						events: {
							apiready: function(event) {
								var frame = event.target;
								frame.player = frame;
								frame.player.seekTo = frame.seek;
								frame.player.duration = preloadDuration;
								frame.player.getDuration = function(){ return frame.duration; };
								waitForAttachedAPIs();
							}
						}
					});

					/*
					** HACK: Dailymotion is also returning embedded Hulu videos, which don't interact
					** at all with the API, including throwing errors. However, we can guess that Hulu
					** videos are uploaded by the official user "hulu".
					*/
					if (response['owner.screenname'] === 'hulu')
					{
						video.errorDescription = "Videos from Hulu don't have a working Javascript API.";
						waitForAttachedAPIs();
					}
				});
			}
			else
			{
				video.errorDescription = "This video doesn't have a working Javascript API.";
				waitForAttachedAPIs();
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

			var newSrc = appendToURI(video.src, apiString);
			newSrc = appendToURI(newSrc, originString);

			/* Only reload if we have to. */
			if (video.src !== newSrc)
			{
				video.src = newSrc;
			}

			function appendToURI(uri, string)
			{
				if (uri.indexOf(string) === -1)
				{
					uri += (uri.indexOf("?") === -1 ? "?" : "&") + string;
				}
				return uri;
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
	}

	/* Set up UI and load and execute theater mode and watch-it-together code. */
	function initialize(disableAutoplay)
	{
		var baseUrl = (developmentEnvironment ? "http://localhost/~kate/mst3k/" : "https://lewis-k.github.io/mst3k-bookmarklet/");

		/* Load the custom MST3K stylesheet. We're temporarily skipping an include guard. */
		var style = document.createElement("link");
		style.href = baseUrl + "style.css";
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

		if (!disableAutoplay && !$("#embed-wrapper").size())
		{
			/* Make it easier to keep the message box on top. */
			$(".link").wrapAll("<div id='embed-wrapper'/>");

			/* Set up relative positioning for messages later on. */
			$("#embed-wrapper").css('position', 'relative');

			/* Add control button. */
			$("<div>")
			  .prop('id', 'watch-it-together')
			  .append("<a href='#'>Watch it together</a> @ ")
			  .insertAfter("h2"); /* Insert after movie title, so it'll settle near the table. */

			/* Set up the messaging box. */
			$("<a>")
			  .prop('id', 'message-box')
			  .prop('href', '#')
			  .appendTo("#embed-wrapper");
		}

		/* Load other scripts. */
		$.getScript(baseUrl + "add-chat.js");
		$.getScript(baseUrl + "theater-mode.js");
		if (!disableAutoplay)
		{
			$.getScript(baseUrl + "watch-it-together.js");
		}
	}

	/* UTILITY FUNCTIONS */

	function getVideoFrames()
	{
		/*
		** Metacafe $(".link embed")
		** YouTube, Vimeo, Dailymotion $(".link iframe")
		*/
		return $(".link iframe, .link embed");
	}

	function jumpstarter(callback, countTo)
	{
		/* Using a closure to emulate a static variable. */
		return (function(){
			var counter = 0;
			return function(){
				++counter;
				if (counter === countTo)
				{
					callback();
				}
			};
		})();
	}
})(window.MST3KTheaterModeOnly, window.MST3KDevelopmentEnvironment);
