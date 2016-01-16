// faxdb-server
//
// Copyright (C) 2016 Aevy AB
//
// Author: Mikael Brockman <mikael@brockman.se>
//
// This software may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.

import * as faxdb from "./index"

function getHead (commits) {
  return faxdb.hash(commits[commits.length - 1])
}

export function create (configuration) {
  var database = { documents: {} }

  return {
    setDocument: function (id, document) {
      database.documents[id] = document
    },

    getDocument: function (id) {
      return database.documents[id]
    },

    saveCommit: function (id, commit) {
      return new Promise(function (resolve, reject) {
        var document = database.documents[id]
        var head = faxdb.hash(document.commits[document.commits.length - 1])
        if (head == commit.parent) {
          database.documents[id].commits.push(commit)
          resolve(true)
        } else {
          resolve(false)
        }
      })
    },

    fetchDocument: function (id) {
      return new Promise(function (resolve, reject) {
        if (database.documents.hasOwnProperty(id)) {
          var document = database.documents[id]
    
          try {
            resolve({
              head: getHead(document.commits),
              state: faxdb.applyCommitSequence(
                document.commits,
                configuration.applyOperation
              )
            })
          } catch (error) {
            reject(error)
          }
        } else {
          resolve(false)
        }
      })
    }
  }
}