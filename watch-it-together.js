/* Load YouTube API. */
if (!window['YT'])
{
	$.getScript("https://www.youtube.com/iframe_api");
}

function onYouTubeIframeAPIReady()
{
	/* Make it easier to keep the message box on top. */
	$(".link").wrapAll("<div id='embed-wrapper'/>");

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
			catchUp();
		}
	}
}

function localStart()
{
	var centralTimeOffset = 420;
	var localStart = new Date();
	localStart.setHours(21, localStart.getTimezoneOffset() - centralTimeOffset, 0, 0);
	return localStart;
}

function getVideoFrames()
{
	return $(".link iframe");
}

function getCurrentVideoFrame()
{
	return $(".link:visible iframe")[0];
}

function catchUp()
{
	var elapsed = Date.now() - localStart().getTime();
	var current = getCurrentVideoFrame();
	if (elapsed < 0)
	{
		/* Avoid jitter if timers fire a little early and the message was previously cleared. */
		if (elapsed < -0.3)
		{
			var message = "This video will automatically start playing at ";
			if (toLocaleTimeStringSupportsLocales())
			{
				message += localStart().toLocaleTimeString({}, { hour: "numeric", minute: "numeric" });
			}
			else
			{
				var start = localStart();
				var afternoon = (start.getHours() >= 12);

				/* Convert from 24-hour time. */
				var hour = start.getHours() % 12;
				if (hour === 0)
				{
					hour = 12;
				}

				/* Pad minutes to two digits. */
				var minutes = start.getMinutes();
				if (minutes < 10)
				{
					minutes = "0" + minutes;
				}

				message += hour + ":" + minutes + " " + (afternoon ? "PM" : "AM");
			}
			message += "! Click the \"Watch it together\" button to cancel, or click to clear this message.";

			showMessage(message);
		}
		makeControlButtonActive();

		if (!window.MST3KTimeoutID)
		{
			window.MST3KTimeoutID = setTimeout(catchUp, -elapsed);
		}
	}
	else if (elapsed > 1000*current.player.getDuration())
	{
		showMessage("The movie has ended for those \"watching it together,\" but that doesn't mean you shouldn't watch it anyway! Click to clear this message.");
		makeControlButtonInactive();
	}
	else
	{
		clearTimer();
		closeMessage();
		makeControlButtonActive();

		current.player.seekTo(Math.floor(elapsed/1000), true);
		current.player.playVideo();
	}
}

function toggle()
{
	if (!window.MST3KTimeoutID)
	{
		catchUp();
	}
	else
	{
		clearTimer();
		closeMessage();
		makeControlButtonInactive();
	}
}

function clearTimer()
{
	if (window.MST3KTimeoutID)
	{
		clearInterval(window.MST3KTimeoutID);
		window.MST3KTimeoutID = false;
	}
}

function makeControlButtonActive()
{
	$("#watch-it-together").css({
		backgroundColor: '#ee0',
		borderStyle: 'inset'
	});
}

function makeControlButtonInactive()
{
	$("#watch-it-together").css({
		backgroundColor: '#ffa',
		borderStyle: 'outset'
	});
}

function showMessage(text)
{
	$("#message-box").text(text).show();
}

function closeMessage()
{
	$("#message-box").hide();
}

function initializeUI()
{
	/* Add control button. */
	$("<a>Watch it together</a>")
	  .prop('id', 'watch-it-together')
	  .prop('href', 'javascript: toggle();')
	  .css({
		display: 'block',
		float: 'right',
		clear: 'both',
		color: '#276a9a',
		backgroundColor: '#ee0',
		fontSize: '16px',
		border: '2px inset #dd0',
		borderRadius: '0.25em',
		padding: '0.1em 0.25em',
		marginBottom: '2px' })
	  .insertAfter("h2"); /* Insert after movie title, so it'll settle near the table. */

	/* Set up relative positioning for messages later on. */
	$("#embed-wrapper").css('position', 'relative');

	/* Set up the messaging box. */
	$("<a>")
	  .prop('id', 'message-box')
	  .prop('href', 'javascript: closeMessage();')
	  .css({
		display: 'none',
		width: '60%',
		padding: '0.5em',
		position: 'absolute',
		top: '25%',
		left: '20%', /* The center, 50%, minus half the width. */
		backgroundColor: '#fafafa',
		borderRadius: '4px' })
	  .appendTo("#embed-wrapper");
}

/* From the MDN documentation. Thanks! */
function toLocaleTimeStringSupportsLocales()
{
	try
	{
		new Date().toLocaleTimeString('i');
	}
	catch (e)
	{
		return e.name === 'RangeError';
	}
	return false;
}
