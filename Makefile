webhome: js #css

js: web_frontend/js/src/*
	browserify -o web_frontend/js/home.js web_frontend/js/src/home.js -i fs -i eccjs -i "proquint-" -i blake2s -i http -i level -i level/sublevel -i level-sublevel/bytewise -i secure-scuttlebutt -i secure-scuttlebutt/defaults -i pull-level

css: web_frontend/sass/*
	compass compile