IGNORES = -i fs -i "proquint-" -i http -i level -i level/sublevel -i level-sublevel/bytewise -i pull-level
webhome: js css
js: js_pub js_home js_gui_sandbox

js_home: web_frontend/src/home.js web_frontend/src/lib/* web_frontend/src/home/*
	browserify -o web_frontend/js/home.js web_frontend/src/home.js $(IGNORES)

js_pub: web_frontend/src/pub.js web_frontend/src/lib/* web_frontend/src/pub/*
	browserify -o web_frontend/js/pub.js web_frontend/src/pub.js $(IGNORES)

js_gui_sandbox: web_frontend/src/gui-sandbox.js web_frontend/src/lib/*
	browserify -o web_frontend/js/gui-sandbox.js web_frontend/src/gui-sandbox.js

css: web_frontend/sass/*
	compass compile