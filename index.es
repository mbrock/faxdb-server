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
    response.statusCode = 200
    response.end(JSON.stringify(object))
  } else {
    response.statusCode = 500
    response.end()
    console.warn(JSON.stringify({
      errors: validator.errors,
      object: object
    }))
  }
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

export function create(givenConfiguration) {
  var configuration = {}
  Object.assign(configuration, defaultConfiguration, givenConfiguration)
  return new Promise((resolve, reject) => {
    resolve((request, response) => {
      configuration.authenticate(request).then(ok => {
        if (ok) {
          if (request.method == "GET") {
            if (request.url == "/") {
              response.statusCode = 404
              response.end()
            } else if (request.url.match(/^\/([^/]+)$/)) {
              configuration.fetchDocument(RegExp.$1).then(document => {
                if (document) {
                  respondWithValidatedJson(
                    response,
                    { document: document },
                    validateCloneSchema
                  )
                } else {
                  response.statusCode = 404
                  response.end()
                }
              }).catch(error => {
                console.warn(error.stack)
                response.statusCode = 500
                response.end()
              })
          } else {
            response.statusCode = 404
            response.end("Hello, world!\n")
          }
        } else if (request.method == "POST") {
          if (request.url.match(/^\/([^/]+)$/)) {
            var id = RegExp.$1
            slurpJSON(request).then(body => {
              if (validateCommitSchema(body)) {
                configuration.saveCommit(id, body.commit).then(success => {
                  if (success) {
                    response.statusCode = 200
                    response.end()
                  } else {
                    response.statusCode = 409
                    response.end()
                  }
                }).catch(error => {
                  response.statusCode = 500
                  response.end()
                })
              } else {
                response.statusCode = 400
                response.end(JSON.stringify({
                  object: body,
                  errors: validateCommitSchema.errors
                }))
              }
            }).catch(error => {
              console.warn(error.stack)
              response.statusCode = 500
              response.end()
            })
          } else {
            response.statusCode = 400
            response.end()
          }
        }
      } else {
          response.statusCode = 403
          response.end()
        }
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