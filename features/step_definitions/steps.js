var faxdb = require("../../index.js")
var mockHttp = require("mock-http")
var assert = require("assert")

var database
var defaultFolderDatabase = {
  documents: {}
}

function setupFolderDatabase () {
  database = Object.assign({}, defaultFolderDatabase)
}

function applyFolderOperation (state, operation) {
  if (operation.type == "rename")
    return Object.assign({}, state, { name: operation.payload })
  else
    throw new Error(
      "Unknown folder operation type: " + JSON.stringify(operation.type)
    )
}

function flatten (arrayOfArrays) {
  return arrayOfArrays.reduce(function (a, b) {
    return a.concat(b)
  }, [])
}

function applyFolderCommitSequence (commits) {
  var operations = flatten(commits)
  if (operations.length == 1)
    return applyFolderOperation({}, operations[0])
  else
    return operations.reduce(applyFolderOperation, {})
}

function hashCommit (previous, operations) {
  return faxdb.hash(operations, previous)
}

function hashCommitSequence (commits) {
  if (commits.length == 1)
    return hashCommit("", commits[0])
  else
    return commits.reduce(hashCommit, "")
}

function tableToCommitSequence (table) {
  return table.rows().map(function (row) {
    return [{ type: row[0], payload: row[1] }]
  })
}

var folderServerConfiguration = {
  authenticate: function (request) {
    return new Promise(function (resolve, reject) {
      if (request.getHeader("X-User"))
        resolve(true)
      else
        resolve(false)
    })
  },

  saveCommit: function (id, parent, commit) {
    return new Promise(function (resolve, reject) {
      var document = database.documents[id]
      if (hashCommitSequence(document.commits) == parent) {
        database.documents[id].commits.push(commit.operations)
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
            hash: hashCommitSequence(document.commits),
            state: applyFolderCommitSequence(document.commits)
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

module.exports = function() {
  this.Given(/^the folder server test environment$/, function () {
    var world = this
    setupFolderDatabase()
    return faxdb.create(folderServerConfiguration).then(function(fax) {
      world.fax = fax
    })
  })

  this.Given(
    /^there is a folder named "([^"]*)" with id "([^"]*)"$/,
    function (name, id) {
      database.documents[id] = {
        commits: [
          [{ type: "rename", payload: name }]
        ]
      }
    }
  )
  
  this.When(/^I make a request as John$/, function () {
    delete this.response
    this.request = {
      headers: {
        "X-User": "john"
      }
    }
  })

  this.When(/^I make an unauthenticated request$/, function () {
    delete this.response
    this.request = {}
  })
  
  this.When(/^the request is for the document "([^"]*)"$/, function (id) {
    this.request.method = "GET"
    this.request.url = "/" + id
  })

  this.When(
    /^the request is an update to "([^"]*)" with operations:$/,
    function (id, table) {
      var body = JSON.stringify({
        operations: flatten(tableToCommitSequence(table)),
        hash: hashCommitSequence(database.documents[id].commits)
      })

      this.request.method = "POST"
      this.request.url = "/" + id
      this.request.buffer = new Buffer(body)
    }
  )
  
  this.When(
    /^the request is a conflicting update to "([^"]*)" with operations:$/,
    function (id, table) {
      var body = JSON.stringify({
        operations: flatten(tableToCommitSequence(table)),
        hash: hashCommitSequence([{ type: "bogus" }])
      })

      this.request.method = "POST"
      this.request.url = "/" + id
      this.request.buffer = new Buffer(body)
    }
  )
  
  this.Then(/^the response status is (\d+)$/, function (expectedStatus) {
    var world = this
    var request = new mockHttp.Request(world.request)

    return new Promise(function(resolve, reject) {
      var response = new mockHttp.Response({
        onEnd: function() {
          try {
            assert.equal(response.headersSent, true)
            assert.equal(response.hasEnded(), true)
            var actualStatus = response.statusCode.toString()
            assert.equal(expectedStatus, actualStatus)

            world.response = response
            resolve()
          } catch (error) {
            reject(error)
          }
        }
      })
      world.fax(request, response)
    })
  })

  this.Then(
    /^the result is a folder document named "([^"]*)"$/,
    function (expectedName) {
      var result = this.getResult()
      assert.deepEqual(result.state, {
        name: expectedName
      })
    }
  )

  this.Then(
    /^the result has a hash that matches commits:$/,
    function (table) {
      var result = this.getResult()
      var hash = hashCommitSequence(tableToCommitSequence(table))
      assert.deepEqual(result.hash, hash)
    }
  )

  this.Then(
    /^the document "([^"]+)" has commits:$/,
    function (id, table) {
      assert.deepEqual(
        database.documents[id].commits,
        tableToCommitSequence(table)
      )
    }
  )
}