// faxdb-server
//
// Copyright (C) 2016 Aevy AB
//
// Author: Mikael Brockman <mikael@brockman.se>
//
// This software may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.

import * as faxdb from "./index"

function getHead(commits) {
  return faxdb.hash(commits[commits.length - 1])
}

export function create(namespaces) {
  var database = {}
  for (var key in namespaces)
    database[key] = { documents: {} }

  function validateNamespace(namespace, resolve) {
    if (!database[namespace]) {
      resolve(404)
      return false
    } else {
      return true
    }
  }
  
  return {
    setDocument: function(namespace, id, document) {
      database[namespace].documents[id] = document
    },

    getDocument: function(namespace, id) {
      return database[namespace].documents[id]
    },

    saveCommit: function(namespace, id, commit) {
      return new Promise((resolve, reject) => {
        if (validateNamespace(namespace, resolve)) {
          var document = this.getDocument(namespace, id)
          var head = faxdb.hash(document.commits[document.commits.length - 1])
          if (head == commit.parent) {
            document.commits.push(commit)
            resolve(200)
          } else {
            resolve(409)
          }
        }
      })
    },

    fetchDocument: function(namespace, id) {
      return new Promise(function(resolve, reject) {
        if (validateNamespace(namespace, resolve)) {
          var document = database[namespace].documents[id]
          if (document) {
            try {
              resolve({
                head: getHead(document.commits),
                state: faxdb.applyCommitSequence(
                  document.commits,
                  namespaces[namespace].applyOperation
                )
              })
            } catch (error) {
              reject(error)
            }
          } else {
            resolve(404)
          }
        }
      })
    }
  }
}
