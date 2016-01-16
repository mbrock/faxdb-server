format ?= pretty

testfiles = features/fax.feature features/step_definitions/steps.js
examples = lib/examples/folders.js
src = lib/index.js lib/memory-db.js lib/test.js
all: $(src) $(examples) $(testfiles) schema.md
lib/%.js: src/%.es; mkdir -p `dirname $@`; node_modules/.bin/babel $< > $@

test:
	node lib/test | bash -ex ./test.sh
	echo
	node_modules/.bin/cucumberjs --format=$(format)

schema.md: lib/schema.js
	node lib/schema > schema.md

