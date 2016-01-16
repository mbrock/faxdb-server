# Fax protocol object

The schema defines the following properties:

This property must be one of the following types:

* `shallow-document-clone`
* `single-commit`

---

# Sub Schemas

The schema defines the following additional types:

## `shallow-document-clone` (object)

A shallow clone of a Fax document

Properties of the `shallow-document-clone` object:

### `document` (object, required)

Properties of the `document` object:

#### `head` (string, required)

The 40-char SHA256 hash of the latest commit

#### `state` (object, required)

The state corresponding to the latest commit

Properties of the `state` object:

## `single-commit` (object)

The properties of a single document commit

Properties of the `single-commit` object:

### `commit` (object, required)

Properties of the `commit` object:

#### `parent` (string,null, required)

The 40-char SHA256 hash of the base commit

#### `operations` (array, required)

The object is an array with all elements of the type `object`.

The array object has the following properties:

Additional restrictions:

* Minimum items: `1`
