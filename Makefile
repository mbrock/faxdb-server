format ?= pretty
NODE_PATH ?= ./node_modules

testfiles = features/fax.feature features/step_definitions/steps.js
examples = lib/examples/folders.js
src = lib/index.js lib/memory-db.js lib/test.js
all: $(src) $(examples) $(testfiles) schema.md
lib/%.js: src/%.js; mkdir -p `dirname $@`; $(NODE_PATH)/.bin/babel $< > $@

test:
	node lib/test | bash -ex ./test.sh
	echo
	$(NODE_PATH)/.bin/cucumberjs --format=$(format)

schema.md: lib/schema.js
	node lib/schema > schema.md

test-docker:
	docker build -t faxdb-server .
	docker run -it --rm faxdb-server make all test

