// faxdb-server
//
// Copyright (C) 2016 Aevy AB
//
// Author: Mikael Brockman <mikael@brockman.se>
//
// This software may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.

let createHash = require("sha.js")

export function create(options) {
  return new Promise((resolve, reject) => {
    resolve((request, response) => {
      response.statusCode = 404
      response.end("Hello, world!\n")
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
