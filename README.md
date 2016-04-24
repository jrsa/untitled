interactive web art for fomo exhibition 2016, by meghan sabik and james anderson

for code related questions hit james at jrsa [at] jrsa [dot] co (not .com)

this thing uses webGL to drop the background out of a greenscreened video. the video is then drawn into a post-processing loop every 20 frames, configurable via the global params.reset variable.

the guts are in index.js, which uses browserify to import helpers for the webGL stuff. there is also a lot of naked webGL in the index.js file. learn more about openGL at http://open.gl

to run standalone, you will need node and npm (http://npmjs.org). once you have those set up, just do npm run build to get the site ready to serve, or npm run dev to run a node web server in the current directory (probably easier unless you already have a local web server set up)