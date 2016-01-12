(function(){
	function pseudorandom(seed)
	{
		/* So very, very far from perfect. An "implementation" of MINSTD from
		** http://random.mat.sbg.ac.at/results/karl/server/node4.html */
		if (seed !== undefined || !pseudorandom.seed)
		{
			pseudorandom.seed = (seed ? seed : 1);
		}
		pseudorandom.seed = Math.pow(7, 5)*pseudorandom.seed % (Math.pow(2, 31)-1);
		return pseudorandom.seed;
	}

	var time = new Date();
	/* Rough adjustment to Central Time. */
	time.setHours(time.getHours() + time.getTimezoneOffset() - 6*60);
	/* Bleck. Iterate through pseudorandom numbers based on a hack using the date. */
	for (var i = 0, target = 100*time.getUTCMonth() + time.getUTCDate(); i < target; ++i)
	{
		var result = pseudorandom();
	}

	/* Hack to pick out episodes, which are loosely "302 - A Title, Yeah?" */
	var episodeLinks = $("a:contains(' - ')");
	document.location = episodeLinks.get(result % episodeLinks.size()).href;
})();
