$("#watch-it-together").on("click", toggle);
$("#message-box").on("click", closeMessage);
catchUp();

function localStart()
{
	var localStart = new Date();

	/*
	** This definitely has bugs! Right now it's a decent approximation to the right
	** solution, which would be actually bringing in a good time library.

	** Daylight Saving Time changes at 2AM local time, starting on the second Sunday
	** in March and ending on the first Sunday in November. We find the beginning
	** and ending of DST (in Central Time) according to UTC and compare with the
	** current UTC time to determine if Central Time is observing DST.
	*/

	/* DST would start at 8AM UTC. */
	var DSTStart = new Date(Date.UTC(localStart.getUTCFullYear(), /* March */ 2, 1, 8));
	/* Move to first Sunday in March... */
	if (DSTStart.getUTCDay() !== 0)
	{
		DSTStart.setUTCDate( DSTStart.getUTCDate() + 7 - DSTStart.getUTCDay() );
	}
	/* ... but DST starts on the second Sunday in March. */
	DSTStart.setUTCDate( DSTStart.getUTCDay() + 7 );

	/* DST would end at 7AM UTC. */
	var DSTEnd = new Date(Date.UTC(localStart.getUTCFullYear(), /* November */ 10, 1, 7));
	/* Move to first Sunday in November. */
	if (DSTEnd.getUTCDay() !== 0)
	{
		DSTEnd.setUTCDate( DSTEnd.getUTCDate() + 7 - DSTEnd.getUTCDay() );
	}

	/* Central Standard Time is UTC-6 when DST is not in effect. */
	var centralTimeOffset = 6 * 60;
	if (DSTStart.getTime() < localStart.getTime() && localStart.getTime() < DSTEnd.getTime())
	{
		/* Central DST is UTC-5. */
		centralTimeOffset -= 60;
	}

	/* Start time is given as 9PM Central. */
	localStart.setHours(21, -(localStart.getTimezoneOffset() - centralTimeOffset), 0, 0);
	return localStart;
}

function getVideoFrames()
{
	return $(".link iframe, .link embed");
}

function getCurrentVideoFrame()
{
	return getVideoFrames().filter(":visible")[0];
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

		current.player.seekTo(Math.floor(elapsed/1000));
		current.player.play();
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

	/* Let's not follow the fake link. */
	return false;
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
	$("#watch-it-together").addClass("watch-it-together-active");
}

function makeControlButtonInactive()
{
	$("#watch-it-together").removeClass("watch-it-together-active");
}

function showMessage(text)
{
	$("#message-box").text(text).show();
}

function closeMessage()
{
	$("#message-box").hide();

	/* Let's not follow the fake link. */
	return false;
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
