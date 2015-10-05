/* Load the custom MST3K stylesheet. */
var style = document.createElement("link");
style.href = "http://localhost/~kate/style.css";
style.rel = "stylesheet";
style.type = "text/css";
document.head.appendChild(style);

/* Load YouTube API. */
if (!window['YT'])
{
	$.getScript("https://www.youtube.com/iframe_api");
}

function onYouTubeIframeAPIReady()
{
	/* Hack to get IE to fire the onReady from the YouTube API. */
	$(".link")
	  .each(function(index, container) {
	  	if (container.style.display !== "block")
		{
			var frame = $(container).find("iframe");
			frame
			  .prop("oldHeight", frame.height())
			  .height(0);
			container.style.display = "block";
		}
	  });

	/*
	** We can attach the player API first, since we 1) only change the source of the
	** frame, not the frame itself, so the player stays put, and 2) the player will
	** automatically fire onReady if the frame changes to be API-capable.
	*/
	getVideoFrames()
	  .each(initializeYouTubePlayer)
	  .each(makeFrameAPICapable);
}

function makeFrameAPICapable(index, frame)
{
	var newSrc = frame.src;
	if (newSrc.indexOf("enablejsapi=1") === -1)
	{
		newSrc += (newSrc.indexOf("?") === -1 ? "?" : "&" ) + "enablejsapi=1";
	}
	if (newSrc.indexOf("origin=") === -1)
	{
		newSrc += (newSrc.indexOf("?") === -1 ? "?" : "&" ) + "origin=" + window.location.origin;
	}

	/* Only reload if we have to. */
	if (frame.src !== newSrc)
	{
		frame.src = newSrc;
	}
}

function initializeYouTubePlayer(index, frame)
{
	if (!frame['player'])
	{
		frame.player = new YT.Player(frame, {
			events: { onReady: jumpstart }
		});
	}
}

/* Hacky! We're trying to delay UI and playing video until everything's loaded. */
function jumpstart()
{
	if (!this.completedLoads)
	{
		this.completedLoads = 1;
	}
	else
	{
		++this.completedLoads;
		if (this.completedLoads === getVideoFrames().length)
		{
			/* Reverse IE hack since we've jumpstarted. */
			$(".link")
			  .each(function(index, container) {
			  	if ($(container).find("iframe").height() === 0)
				{
					container.style.display = "none";
					var frame = $(container).find("iframe");
					frame.height(frame.prop("oldHeight"));
				}
			  });

			initializeUI();
			$.getScript("http://localhost/~kate/theater-mode.js");
			$.getScript("http://localhost/~kate/watch-it-together.js");
		}
	}
}

function getVideoFrames()
{
	return $(".link iframe");
}

function getCurrentVideoFrame()
{
	return $(".link:visible iframe")[0];
}

function initializeUI()
{
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
}
