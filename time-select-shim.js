function TimeSelector()
{
	this.hourSelect = makeSelect( [12].concat(range(1, 12)) );
	this.minuteSelect = makeSelect( range(0, 60, 5).map(function(x) { return (x < 10 ? '0' + x : x); }) );
	this.meridianSelect = makeSelect( ["AM", "PM"] );

	var DOMElement = document.createElement("span");
	DOMElement.appendChild(this.hourSelect);
	DOMElement.appendChild(document.createTextNode(":"));
	DOMElement.appendChild(this.minuteSelect);
	DOMElement.appendChild(this.meridianSelect);

	this.DOMElement = DOMElement;

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

TimeSelector.prototype.toDateObject = function()
{
	var time = new Date();
	time.setHours(this.getHour(), this.getMinute(), 0, 0);
	return time;
}
TimeSelector.prototype.getHour = function()
{
	return (parseInt(this.hourSelect.selectedOptions[0].value, 10) % 12) + (this.getMeridian() === "PM" ? 12 : 0);
}
TimeSelector.prototype.getMinute = function()
{
	return parseInt(this.minuteSelect.selectedOptions[0].value, 10);
}
TimeSelector.prototype.getMeridian = function()
{
	return this.meridianSelect.selectedOptions[0].value;
}

TimeSelector.prototype.setTime = function(time)
{
	this.setHour(time.getHours());
	this.setMinute(time.getMinutes());
}
TimeSelector.prototype.setHour = function(hour)
{
	this.setMeridian( (hour % 24 < 12 ? "AM" : "PM") );
	return this.hourSelect.options[ (hour % 12) ].selected = true;
}
TimeSelector.prototype.setMinute = function(minute)
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
TimeSelector.prototype.setMeridian = function(meridian)
{
	return this.meridianSelect.options[ (meridian === "AM" ? 0 : 1) ].selected = true;
}
