if (!$("#wrapper").size())
{
	/* Collect the various sections into groupings. */
	$("#user_bar, .function_bar").wrapAll("<div id='tool_header'/>");
	$("#info_bar, #tab_bar, #posts").wrapAll("<div id='wrapper'/>");
	$("#content > :not(#tool_header, #wrapper)").wrapAll("<div id='remnants'/>");

	/* Add control button. */
	var uiControl = $("<label><input type='checkbox' value='?'> Theater mode</label>")
	  .css({
		float: "right",
		clear: "both",
		color: "#276a9a", /* Constants taken from computed CSS styles for class link_button */
		backgroundColor: "#ffa",
		border: "1px solid #dd0",
		borderRadius: "0.25em",
		padding: "0.1em 0.25em",
		marginBottom: "2px",
		fontSize: "16px" })
	  .insertAfter("h2") /* Insert after movie title, so it'll settle near the table. */
	  .find("input").on("click", toggleTheaterMode);
}

function styleTheaterMode()
{
	$("#sidebar").hide();

	/* Widen the aperture (aka "theater mode") */
	$("#content")
	  .parent()
	  .css({
		width: 'auto' }) /* Arbitrary; fullscreen looks about right for now. */
	  .end()
	  .css({
		position: 'relative',
		float: 'none',
		width: 'auto',
		overflow: 'auto', /* This ensures the background displays over floated elements. ??? */
		paddingBottom: 0
	  });

	/* Split movie and user content to the left and right. */
	$("#remnants").css({
		float: 'left',
		width: '650px' /* Constant from CSS class for #content */
	});
	$("#wrapper")
	  .css({
		position: 'relative',
		float: 'right',
		marginRight: '-20px' /* Constant from CSS class for .link */
	});

	function dynamicStyling()
	{
		/* Set width to nest user content alongside the movie. */
		$("#wrapper").width(function() {
			return	$("#content").width()
				- $("div.link:visible").outerWidth()
				- parseInt($("div.link:visible").css('margin-left'), 10);
		});

		/* Chat scrolls down, so align bottom of chat with bottom of the movie block. */
		$("#tlkio").height(function(){
			return 	$("#remnants").outerHeight()
				- $("#posts").position().top /* Convoluted because to set height properly, all elements in the calculation must be visible. So no self-referencing. */
				- 2*parseInt($("#posts").css('padding-top'), 10);
				- 2*parseInt($("#posts").css('border-top'), 10);
		});
	}

	dynamicStyling();
	$(window).resize(dynamicStyling);
}

function unstyleTheaterMode()
{
	$(window).off("resize");
	$("#content").parent().add("#remnants, #content, #wrapper").removeAttr("style");
	$("#tlkio").height('1000px'); /* Constant from source */
	$("#sidebar").show();
}

function toggleTheaterMode(event)
{
	if (event.target.checked)
	{
		styleTheaterMode();
	}
	else
	{
		unstyleTheaterMode();
	}
}
