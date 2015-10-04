#!/bin/bash

# A very dumb, barebones method of "deploying" work to the webserver.
cat	theater-mode.js \
	watch-it-together.js \
> /Users/kate/Sites/mst3k.js;

echo "MST3K bookmarklet deployed to webserver.";
