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
