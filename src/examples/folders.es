// faxdb-server
//
// Copyright (C) 2016 Aevy AB
//
// Author: Mikael Brockman <mikael@brockman.se>
//
// This software may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.

module.exports = {
  applyOperation: function (state, operation) {
    if (operation.type == "rename")
      return Object.assign({}, state, { name: operation.payload })
    else
      throw new Error(
        "Unknown folder operation type: " + JSON.stringify(operation.type)
      )
  }
}

