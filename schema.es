// faxdb-server
//
// Copyright (C) 2016 Aevy AB
//
// Author: Mikael Brockman <mikael@brockman.se>
//
// This software may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.

const schemaUrl = "http://json-schema.org/draft-04/schema#"

export const shallowDocumentClone = {
  "$schema": schemaUrl,
  title: "Fax Document",
  description: "A shallow clone of a Fax document",
  type: "object",
  required: ["document"],
  properties: {
    "document": {
      type: "object",
      required: ["head", "state"],
      properties: {
        "head": {
          type: "string",
          description: "The 40-char SHA256 hash of the latest commit"
        },
        "state": {
          type: "object",
          description: "The state corresponding to the latest commit"
        }
      }
    }
  }
}

export const singleCommit = {
  "$schema": schemaUrl,
  title: "Single Fax Commit",
  description: "The properties of a single document commit",
  type: "object",
  required: ["commit"],
  properties: {
    "commit": {
      type: "object",
      required: ["parent", "operations"],
      properties: {
        "parent": {
          type: ["string", "null"],
          description: "The 40-char SHA256 hash of the base commit"
        },
        "operations": {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            description: "Domain-specific operation object"
          }
        }
      }
    }
  }
}

export const anyProtocolObject = {
  "$schema": schemaUrl,
  title: "Fax protocol object",
  type: "object",
  oneOf: [
    { "$ref": "#/definitions/shallow-document-clone" },
    { "$ref": "#/definitions/single-commit" }
  ],
  definitions: {
    "shallow-document-clone": shallowDocumentClone,
    "single-commit": singleCommit
  }
}

if (require.main === module) {
  var markdown = require("json-schema-to-markdown")(anyProtocolObject)
  console.log(markdown)
}
