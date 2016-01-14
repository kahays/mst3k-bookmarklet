[Club MST3k](http://www.club-mst3k.com) is a compendium of Mystery Science Theater 3000 videos, complete with user-submitted quotes, comments, forum and recently, a chat function rolled into the "episode of the day," called Watch-It-Together.

This is a script to enhance the Watch-It-Together experience. It can

- hoist the chat alongside the video, a.k.a. "theater mode"
- embed a chatroom for any episode
- queue and automatically play videos for supported embeds (YouTube, Dailymotion and Vimeo)
- catch up to an episode in progress, even after pausing

### How to use this
Simply [add this as a bookmark](javascript:$.getScript("http://lewis-k.github.io/shim.js");), navigate to [an episode](http://www.club-mst3k.com/820-space-mutiny) and load the bookmark.

### Known bugs
- Fix race condition where catchUp() fires before the YouTube frame is ready.
- Fix Dailymotion hiccup where the (Flash?) player has trouble seeking/playing in the right place after the first invocation of catchUp() after it was reloaded.
- Fix IE message overlay.
- Ensure support for Chrome, Safari, Firefox and IE.

### Todo
- Improve code underlying the warning message for embeds with no API support (MetaCafe, Hulu via Dailymotion.)
- Have a way to reset the time selected for WIT.
- Make a unified player interface (all we use is play(), seek() and getDuration().)
- Hulu embeds (via Dailymotion) don't support the Dailymotion API?
- Improve API support for YouTube, Vimeo and Dailymotion embeds.
- Add API support for Metacafe.

### Notes
- [Godzilla vs. Megalon](http://www.club-mst3k.com/212-godzilla-vs-megalon) has Dailymotion and YouTube embeds. In Chrome, this will crash if the debugger is open.
- [Godzilla vs. the Sea Monster](http://www.club-mst3k.com/213-godzilla-vs-the-sea-monster) has Metacafe, YouTube and Dailymotion embeds. The Dailymotion embed is somehow from Hulu and doesn't play nice.
- [Kitten With a Whip](http://www.club-mst3k.com/615-kitten-with-a-whip) has a Vimeo embed.
