testfiles = features/fax.feature features/step_definitions/steps.js
all: index.js test.js $(testfiles) schema.md
%.js: %.es .npm-dummy; node_modules/.bin/babel $< > $@
.npm-dummy: package.json; npm install && touch .npm-dummy

test: all
	node test | bash -ex ./test.sh
	echo
	node_modules/.bin/cucumberjs

schema.md: schema.js
	node schema > schema.md

