#IGNORES = -i fs -i eccjs -i "proquint-" -i blake2s -i http -i level -i level/sublevel -i level-sublevel/bytewise -i secure-scuttlebutt -i secure-scuttlebutt/defaults -i pull-level
IGNORES = -i fs -i "proquint-" -i http -i level -i level/sublevel -i level-sublevel/bytewise -i pull-level
webhome: js css
js: js_pub js_home

js_home: web_frontend/src/home.js web_frontend/src/lib/* web_frontend/src/home/*
	browserify -o web_frontend/js/home.js web_frontend/src/home.js $(IGNORES)

js_pub: web_frontend/src/pub.js web_frontend/src/lib/* web_frontend/src/pub/*
	browserify -o web_frontend/js/pub.js web_frontend/src/pub.js $(IGNORES)

css: web_frontend/sass/*
	compass compile