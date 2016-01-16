// faxdb-server
//
// Copyright (C) 2016 Aevy AB
//
// Author: Mikael Brockman <mikael@brockman.se>
//
// This software may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.

import * as faxdb from "./index"
import * as assert from "assert"

assert.equal(
  faxdb.hash({ operations: [0], parent: "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d" }),
  "e9c24f86b79b07a943aeacce1929a7caecd89f57"
)

faxdb.create().then(fax => {
  let server = require("http").createServer(fax)

  server.listen()
  server.on("listening", () => {
    console.log(`${server.address().port} ${process.pid}`)
  })
})
