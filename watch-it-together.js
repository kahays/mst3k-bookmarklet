/* Load YouTube API. */
if (!window['YT'])
{
	$.getScript("https://www.youtube.com/iframe_api");
}

function onYouTubeIframeAPIReady()
{
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
			showMessage(	"This video will automatically start playing at "
					+ localStart().toLocaleTimeString({}, { hour: "numeric", minute: "numeric" })
					+ "! Click the \"Watch it together\" button to cancel, or click to clear this message.");
		}
		makeControlButtonActive();

		if (!current.timeoutId)
		{
			current.timeoutId = setTimeout(catchUp, -elapsed);
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
	if (!getCurrentVideoFrame().timeoutId)
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
	var current = getCurrentVideoFrame();
	if (current.timeoutId)
	{
		clearInterval(current.timeoutId);
		current.timeoutId = false;
	}
}

function makeControlButtonActive()
{
	$("#watch_it_together").css({
		backgroundColor: '#ee0',
		borderStyle: 'inset'
	});
}

function makeControlButtonInactive()
{
	$("#watch_it_together").css({
		backgroundColor: '#ffa',
		borderStyle: 'outset'
	});
}

function showMessage(text)
{
	/* Place message box on top. */
	if (!getCurrentVideoFrame().nextElementSibling)
	{
		$("#message_box").insertAfter(getCurrentVideoFrame());
	}

	$("#message_box").text(text).show();
}

function closeMessage()
{
	$("#message_box").hide();
}

function initializeUI()
{
	/* Add control button. */
	$("<a>Watch it together</a>")
	  .prop('id', 'watch_it_together')
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
	$(".link").css('position', 'relative');

	/* Set up the messaging box. */
	$("<a>")
	  .prop('id', 'message_box')
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
	  .appendTo(getCurrentVideoFrame().parentElement);
}
