format ?= pretty

testfiles = features/fax.feature features/step_definitions/steps.js
all: index.js test.js $(testfiles) schema.md
%.js: %.es; node_modules/.bin/babel $< > $@

test:
	node test | bash -ex ./test.sh
	echo
	node_modules/.bin/cucumberjs --format=$(format)

schema.md: schema.js
	node schema > schema.md

