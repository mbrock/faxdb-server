all: index.js test.js
%.js: %.es .npm-dummy; node_modules/.bin/babel $< > $@
.npm-dummy: package.json; npm install && touch .npm-dummy
test: all; node test | bash -ex ./test.sh
