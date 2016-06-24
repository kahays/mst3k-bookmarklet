[Club MST3k](http://www.club-mst3k.com) is a compendium of Mystery Science Theater 3000 videos, complete with user-submitted quotes, comments, forum and recently, a chat function rolled into the "episode of the day," called Watch-It-Together.

This is a script to enhance the Watch-It-Together experience. It can

- hoist the chat alongside the video, a.k.a. "theater mode"
- embed a chatroom for any episode
- queue and automatically play videos for supported embeds (YouTube, Dailymotion and Vimeo)
- catch up to an episode in progress, even after pausing

### How to use this
Follow the instructions [provided here](http://lewis-k.github.io/mst3k/).

### Known bugs
- The chat window from [tlk.io](https://tlk.io) may not be functional. This is a [known issue](https://trello.com/c/6kd37wql/278-degrade-to-using-cookies-if-localstorage-is-not-accessible) which can be worked around by changing your browser settings to allow third-party storage from [tlk.io](https://tlk.io), but there's nothing I can do on this end right now. :(
- The message overlay may be hidden in Internet Explorer.
- Autoplay may misfire due to a race condition where catchUp() fires before the YouTube frame is ready.
- Another autoplay hiccup where the Dailymotion player (Flash only?) won't seek/play in the right place the first time we call catchUp() after the video has reloaded.

### Todo
- Improve code underlying the warning message for embeds with no API support (MetaCafe, Hulu via Dailymotion, bare links.)
- Have a way to reset the time selected for Watch-It-Together.
- Make a unified player interface (all we use is play(), seek() and getDuration().)
- Improve API support for YouTube, Vimeo and Dailymotion embeds.
- Find API support for Metacafe and Hulu embeds via Dailymotion.

### Notes
- [Godzilla vs. Megalon](http://www.club-mst3k.com/episodes/212-godzilla-vs-megalon) has Dailymotion and YouTube embeds. In Chrome, this will crash if the debugger is open.
- [Godzilla vs. the Sea Monster](http://www.club-mst3k.com/episodes/213-godzilla-vs-the-sea-monster) has Metacafe, YouTube and Dailymotion embeds. The Dailymotion embed is somehow from Hulu and doesn't play nice.
- [Kitten With a Whip](http://www.club-mst3k.com/episodes/615-kitten-with-a-whip) has a Vimeo embed.
