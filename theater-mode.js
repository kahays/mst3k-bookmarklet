$("#theater-mode").find("input").on("click", toggleTheaterMode);

function styleTheaterMode()
{
	$("#sidebar").hide();
	$("#content").parent().add("#video-content, #content, #user-content, #tab_bar").addClass("theater");

	function dynamicStyling()
	{
		/* Set width to nest user content alongside the movie. */
		$("#user-content").width(function() {
			return	$("#content").width()
				- $("div.link:visible").outerWidth()
				- parseInt($("div.link:visible").css('margin-left'), 10);
		});

		/* Chat scrolls down, so align bottom of chat with bottom of the movie block. */
		$("#tlkio").height(function(){
			return 	$("#video-content").outerHeight()
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
	$("#content").parent().add("#video-content, #content, #user-content, #tab_bar").removeClass("theater");
	$("#user-content").width("auto");
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
