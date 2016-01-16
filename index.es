// faxdb-server
//
// Copyright (C) 2016 Aevy AB
//
// Author: Mikael Brockman <mikael@brockman.se>
//
// This software may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.

let createHash = require("sha.js")
let validator = require("is-my-json-valid")

let schema = require("./schema")
let validateCommitSchema = validator(schema.singleCommit)
let validateCloneSchema = validator(schema.shallowDocumentClone)

function respondWithValidatedJson (response, object, validator) {
  if (validator(object)) {
    respond(response, 200, JSON.stringify(object))
  } else {
    respond(response, 500)
    console.warn(JSON.stringify({
      errors: validator.errors,
      object: object
    }))
  }
}

function respond (response, code, message) {
  response.statusCode = code
  response.end(message)
}

var defaultConfiguration = {
  authenticate: function (request) {
    return new Promise(function (resolve) {
      resolve(true)
    })
  },

  fetchDocument: function (id) {
    return new Promise(function (resolve) {
      resolve(false)
    })
  },

  saveCommit: function (id, parent, commit) {
    return new Promise(function (resolve) {
      resolve(false)
    })
  }
}

function fetchDocument(response, configuration, id) {
  configuration.fetchDocument(id).then(document => {
    if (document) {
      respondWithValidatedJson(
        response,
        { document: document },
        validateCloneSchema
      )
    } else {
      respond(response, 404)
    }
  }).catch(error => {
    console.warn(error.stack)
    respond(response, 500)
  })
}

function postCommit(response, configuration, id, request) {
  slurpJSON(request).then(body => {
    if (validateCommitSchema(body)) {
      configuration.saveCommit(id, body.commit).then(ok => {
        if (ok) {
          respond(response, 200)
        } else {
          respond(response, 409)
        }
      }).catch(error => {
        respond(response, 500)
      })
    } else {
      respond(response, 400, JSON.stringify({
        object: body,
        errors: validateCommitSchema.errors
      }))
    }
  }).catch(error => {
    console.warn(error.stack)
    respond(response, 500)
  })
}

function handleAuthenticatedRequest (response, configuration, request) {
  if (request.method == "GET") {
    if (request.url == "/") {
      respond(response, 404)
    } else if (request.url.match(/^\/([^/]+)$/)) {
      fetchDocument(response, configuration, RegExp.$1)
    } else {
      respond(response, 404, "Hello, world!\n")
    }
  } else if (request.method == "POST") {
    if (request.url.match(/^\/([^/]+)$/)) {
      postCommit(response, configuration, RegExp.$1, request)
    } else {
      respond(response, 400)
    }
  }
}

export function create(givenConfiguration) {
  var configuration = {}
  Object.assign(configuration, defaultConfiguration, givenConfiguration)
  return new Promise((resolve, reject) => {
    resolve((request, response) => {
      configuration.authenticate(request).then(ok => {
        if (ok) {
          handleAuthenticatedRequest(response, configuration, request)
        } else {
          respond(response, 403)
        }
      }).catch(error => {
        respond(response, 500)
      })
    })
  })
}

export function hash(operations, oldHash) {
  let sha256 = createHash("sha256")
  let json = JSON.stringify(operations)
  if (oldHash) {
    sha256.update(oldHash, "utf8")
  }
  sha256.update(json, "utf8")
  return sha256.digest("hex").substr(0, 40)
}

function slurpJSON(request) {
  var body = ""
  request.setEncoding("UTF-8")
  request.on("data", x => body += x)
  return new Promise((resolve, reject) => {
    request.on("end", () => resolve(JSON.parse(body)))
    request.on("error", error => reject(error))
  })
}