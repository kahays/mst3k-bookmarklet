(function(){
	function init()
	{
		controller.DOMElement.on("click", function(){
			controller.toggle();
			return false;
		});
		message.DOMElement.on("click", function(){
			message.close();
			return false;
		});

		/* Hack to show warning for videos that can't autoplay. This is based on the function from the (minified) application.js powering MST3K. */
		$("table.link_bar .link_button:not(.dvd) a")
		  .click(function(e){
			var t = e.target.id || $(e.target).parent().attr("id");
			var video = $("#link_"+t).find("iframe, embed");
			message.updateWithVideo(video);
			return false;
		  });

		/* Set up a time selector with the maximum appropriate time for a person to "catch up." */
		var longestMovie = Math.max.apply(undefined, video.all().map(function(){ return (this.player ? this.player.getDuration() : 0); }).toArray());
		timeSelector = new RollingTimeSelector(new Date( Date.now() - longestMovie*1000 ));
		timeSelector.setTime(localStart());
		$(timeSelector.DOMElement)
		  .find("select")
		  .on("change", function() {
			timer.clear();
			message.updateWithVideo();
			controller.deactivate();
		  })
		  .end()
		  .appendTo("#watch-it-together");

		catchUp();
	}

	function catchUp()
	{
		/* This function is usually called through setTimeout(), which means we can't use the /this/ value to any effect. */
		var elapsed = Date.now() - timeSelector.toDateObject().getTime();
		var current = video.current();
		timer.clear();
		if (!video.isScriptable())
		{
			message.updateWithVideo();
			controller.deactivate();
		}
		else if (elapsed < 0)
		{
			timer.set(-elapsed);
			message.updateWithVideo();
			controller.activate();
		}
		else if (elapsed > 1000*current.player.getDuration())
		{
			message.show("The movie has ended for those \"watching it together,\" but that doesn't mean you shouldn't watch it anyway! Click to clear this message.");
			controller.deactivate();
		}
		else
		{
			message.close();
			controller.activate();

			current.player.seekTo(Math.floor(elapsed/1000));
			current.player.play();
		}
	}

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
	}

	var timer = {
		id: false,
		isSet: function(){ return this.id !== false; },
		set: function(duration){
			this.id = setTimeout(catchUp, duration);
		},
		clear: function(){
			if (this.id)
			{
				clearInterval(this.id);
				this.id = false;
			}
		}
	};

	var timeSelector;

	var message = {
		DOMElement: $("#message-box"),
		setText: function(text){
			this.DOMElement.text(text);
		},
		updateWithVideo: function(targetVideo){
			if (targetVideo === undefined)
			{
				targetVideo = video.current();
			}

			if (!video.isScriptable(targetVideo))
			{
				/* Always show a message if autoplay isn't supported. */
				var message = "This video can't be autoplayed. Sorry! Click to clear this message.";
				this.state.isDisplayingUnsupported = true;
			}
			/* Make sure we're not showing a message if the user already cleared them. */
			else if (!this.state.shouldDisplayReadyMessage || !timer.isSet())
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
					message += timeSelector.toDateObject().toLocaleTimeString({}, { hour: "numeric", minute: "numeric" });
				}
				else
				{
					var start = timeSelector.toDateObject();
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
				if (new Date().getDate() !== timeSelector.toDateObject().getDate())
				{
					var nextDay = timeSelector.toDateObject().getDate();
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
	};

	var controller = {
		DOMElement: $("#watch-it-together a"),
		toggle: function(){
			if (!video.isScriptable())
			{
				/* can't autoplay */
				message.updateWithVideo();
			}
			else if (!timer.isSet())
			{
				message.state.shouldDisplayReadyMessage = true;
				catchUp();
			}
			else
			{
				timer.clear();
				message.close();
				controller.deactivate();
			}
		},
		activate: function(){
			this.DOMElement.addClass("watch-it-together-active");
		},
		deactivate: function(){
			this.DOMElement.removeClass("watch-it-together-active");
		}
	};

	var video = {
		current: function(){
			return this.all().filter(":visible")[0];
		},
		all: function(){
			return $(".link iframe, .link embed");
		},
		isScriptable: function(){
			return !!$( (arguments.length ? arguments[0] : this.current()) ).prop('player');
		}
	};

	function RollingTimeSelector(referenceTime)
	{
		referenceTime.setMinutes(0, 0, 0);

		var hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
		var startingIndex = referenceTime.getHours() % 12;
		hours = hours.slice(startingIndex).concat(hours.slice(0, startingIndex));
		this.hourSelect = makeSelect( hours );
		this.minuteSelect = makeSelect( range(0, 60, 5).map(function(x) { return (x < 10 ? '0' + x : x); }) );
		this.meridianSelect = makeSelect( ["AM", "PM"] );

		var DOMElement = document.createElement("span");
		DOMElement.appendChild(this.hourSelect);
		DOMElement.appendChild(document.createTextNode(":"));
		DOMElement.appendChild(this.minuteSelect);
		DOMElement.appendChild(this.meridianSelect);

		this.DOMElement = DOMElement;
		this.referenceTime = referenceTime;

		function makeSelect(options)
		{
			for (var i = 0, result = document.createElement("select"); i < options.length; ++i)
			{
				var option = document.createElement("option");
				option.text = options[i];
				result.appendChild(option);
			}
			return result;
		}

		function range()
		{
			var start = (arguments.length > 1 ? arguments[0] : 0);
			var stop = (arguments.length > 1 ? arguments[1] : arguments[0]);
			var step = (arguments[2] ? arguments[2] : 1);

			for (var i = start, result = []; i < stop; i += step)
			{
				result.push(i);
			}
			return result;
		}
	}

	RollingTimeSelector.prototype.toDateObject = function()
	{
		var time = new Date(this.referenceTime);
		time.setHours(
			this.referenceTime.getHours() + this.hourSelect.selectedIndex,
			this.minuteSelect.selectedOptions[0].value,
			0,
			0);
		var currentMeridian = (time.getHours() < 12 ? "AM" : "PM");
		if (currentMeridian !== this.getMeridian())
		{
			time.setHours(time.getHours() + 12);
		}
		return time;
	}
	RollingTimeSelector.prototype.getHour = function()
	{
		return (parseInt(this.hourSelect.selectedOptions[0].value, 10) % 12) + (this.getMeridian() === "PM" ? 12 : 0);
	}
	RollingTimeSelector.prototype.getMinute = function()
	{
		return parseInt(this.minuteSelect.selectedOptions[0].value, 10);
	}
	RollingTimeSelector.prototype.getMeridian = function()
	{
		return this.meridianSelect.selectedOptions[0].value;
	}

	RollingTimeSelector.prototype.setTime = function(time)
	{
		this.setHour(time.getHours());
		this.setMinute(time.getMinutes());
	}
	RollingTimeSelector.prototype.setHour = function(hour)
	{
		this.setMeridian( (hour % 24 < 12 ? "AM" : "PM") );
		return this.hourSelect.options[ ((hour - (+this.hourSelect.options[0].value) + 12) % 12) ].selected = true;
	}
	RollingTimeSelector.prototype.setMinute = function(minute)
	{
		/* Pick the first minute option that is equal to, or later than, the given minute. */
		for (var i = 0; i < this.minuteSelect.options.length && parseInt(this.minuteSelect.options[i].value, 10) < minute; ++i) {}
		/* Rolling back to the first minute available, so we tick the hour over for convenience. */
		if (i >= this.minuteSelect.options.length)
		{
			i = 0;
			this.setHour(this.getHour() + 1);
		}
		return this.minuteSelect.options[i].selected = true;
	}
	RollingTimeSelector.prototype.setMeridian = function(meridian)
	{
		return this.meridianSelect.options[ (meridian === "AM" ? 0 : 1) ].selected = true;
	}

	init();

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
})();
