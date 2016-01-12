if (!window.MST3K)
{
	window.MST3K = {};
}

if (!MST3K.watchItTogether)
{
	MST3K.watchItTogether = {
		init: function(){
			this.controller.DOMElement.on("click", function(){
				MST3K.watchItTogether.controller.toggle();
				return false;
			});
			this.message.DOMElement.on("click", function(){
				MST3K.watchItTogether.message.close();
				return false;
			});

			/* Hack to show warning for videos that can't autoplay. This is based on the function from the (minified) application.js powering MST3K. */
			$("table.link_bar .link_button:not(.dvd) a")
			  .click(function(e){
				var t = e.target.id || $(e.target).parent().attr("id");
				var video = $("#link_"+t).find("iframe, embed");
				MST3K.watchItTogether.message.updateWithVideo(video);
				return false;
			  });

			/* Set up a time selector with the maximum appropriate time for a person to "catch up." */
			var longestMovie = Math.max.apply(undefined, MST3K.watchItTogether.video.all().map(function(){ return (this.player ? this.player.getDuration() : 0); }).toArray());
			this.timeSelector = new RollingTimeSelector(new Date( Date.now() - longestMovie*1000 ));
			this.timeSelector.setTime(this.localStart());
			$(this.timeSelector.DOMElement)
			  .find("select")
			  .on("change", function() {
				MST3K.watchItTogether.timer.clear();
				MST3K.watchItTogether.message.updateWithVideo();
				MST3K.watchItTogether.controller.deactivate();
			  })
			  .end()
			  .appendTo("#watch-it-together");

			MST3K.watchItTogether.catchUp();
		},

		catchUp: function(){
			/* This function is usually called through setTimeout(), which means we can't use the /this/ value to any effect. */
			var elapsed = Date.now() - MST3K.watchItTogether.timeSelector.toDateObject().getTime();
			var current = MST3K.watchItTogether.video.current();
			MST3K.watchItTogether.timer.clear();
			if (!MST3K.watchItTogether.video.isScriptable())
			{
				MST3K.watchItTogether.message.updateWithVideo();
				MST3K.watchItTogether.controller.deactivate();
			}
			else if (elapsed < 0)
			{
				MST3K.watchItTogether.timer.set(-elapsed);
				MST3K.watchItTogether.message.updateWithVideo();
				MST3K.watchItTogether.controller.activate();
			}
			else if (elapsed > 1000*current.player.getDuration())
			{
				MST3K.watchItTogether.message.show("The movie has ended for those \"watching it together,\" but that doesn't mean you shouldn't watch it anyway! Click to clear this message.");
				MST3K.watchItTogether.controller.deactivate();
			}
			else
			{
				MST3K.watchItTogether.message.close();
				MST3K.watchItTogether.controller.activate();

				current.player.seekTo(Math.floor(elapsed/1000));
				current.player.play();
			}
		},

		localStart: function(){
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
			/* Move to second Sunday in March. */
			if (DSTStart.getUTCDay() !== 0)
			{
				DSTStart.setUTCDate( DSTStart.getUTCDate() + 14 - DSTStart.getUTCDay() );
			}

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
		},

		timer: {
			id: false,
			isSet: function(){ return this.id !== false; },
			set: function(duration){
				this.id = setTimeout(MST3K.watchItTogether.catchUp, duration);
			},
			clear: function(){
				if (this.id)
				{
					clearInterval(this.id);
					this.id = false;
				}
			}
		},

		message: {
			DOMElement: $("#message-box"),
			setText: function(text){
				this.DOMElement.text(text);
			},
			updateWithVideo: function(video){
				if (video === undefined)
				{
					video = MST3K.watchItTogether.video.current();
				}

				if (!MST3K.watchItTogether.video.isScriptable(video))
				{
					/* Always show a message if autoplay isn't supported. */
					var message = "This video can't be autoplayed. Sorry! Click to clear this message.";
					this.state.isDisplayingUnsupported = true;
				}
				/* Make sure we're not showing a message if the user already cleared them. */
				else if (!this.state.shouldDisplayReadyMessage || !MST3K.watchItTogether.timer.isSet())
				{
					this.close();
					return;
				}
				else
				{
					/* Timer's set and we want to see a message. */
					var message = "This video will automatically start playing at ";
					if (toLocaleTimeStringSupportsLocales())
					{
						message += MST3K.watchItTogether.timeSelector.toDateObject().toLocaleTimeString({}, { hour: "numeric", minute: "numeric" });
					}
					else
					{
						var start = MST3K.watchItTogether.timeSelector.toDateObject();
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
					if (new Date().getDate() !== MST3K.watchItTogether.timeSelector.toDateObject().getDate())
					{
						var nextDay = MST3K.watchItTogether.timeSelector.toDateObject().getDate();
						message += " on the " + nextDay;
						/* Hack for suffixes. */
						message += ["th", "st", "nd", "rd"][ ((11 <= nextDay && nextDay <= 13) || (nextDay % 10 > 3) ? 0 : nextDay % 10) ];
					}
					message += "! Click the \"Watch it together\" button to cancel, or click to clear this message.";
				}

				this.show(message);
			},
			show: function(){
				if (arguments.length)
				{
					this.setText(arguments[0]);
				}
				this.DOMElement.show();
			},
			close: function(){
				this.DOMElement.hide();
				this.state.shouldDisplayReadyMessage = false;
			},
			state: {
				shouldDisplayReadyMessage: true,
				isDisplayingUnsupported: false
			}
		},

		controller: {
			DOMElement: $("#watch-it-together a"),
			toggle: function(){
				if (!MST3K.watchItTogether.video.isScriptable())
				{
					/* can't autoplay */
					MST3K.watchItTogether.message.updateWithVideo();
				}
				else if (!MST3K.watchItTogether.timer.isSet())
				{
					MST3K.watchItTogether.message.state.shouldDisplayReadyMessage = true;
					MST3K.watchItTogether.catchUp();
				}
				else
				{
					MST3K.watchItTogether.timer.clear();
					MST3K.watchItTogether.message.close();
					MST3K.watchItTogether.controller.deactivate();
				}
			},
			activate: function(){
				this.DOMElement.addClass("watch-it-together-active");
			},
			deactivate: function(){
				this.DOMElement.removeClass("watch-it-together-active");
			}
		},

		video: {
			current: function(){
				return this.all().filter(":visible")[0];
			},
			all: function(){
				return $(".link iframe, .link embed");
			},
			isScriptable: function(){
				return !!$( (arguments.length ? arguments[0] : this.current()) ).prop('player');
			}
		},

	};

	MST3K.watchItTogether.init();
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
