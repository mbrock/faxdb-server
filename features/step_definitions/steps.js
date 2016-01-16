var faxdb = require("../../lib/index")
var faxMemory = require("../../lib/memory-db")
var folderExample = require("../../lib/examples/folders")

var mockHttp = require("mock-http")
var assert = require("assert")

var database

function setupFolderDatabase() {
  database = faxMemory.create(folderExample)
}

function tableToOperations(table) {
  return table.rows().map(function(row) {
    return { type: row[0], payload: row[1] }
  })
}

function tableToCommitSequence(table) {
  var parent = null
  return tableToOperations(table).map(function(operation) {
    var commit = {
      parent: parent,
      operations: [operation]
    }
    parent = faxdb.hash(commit)
    return commit
  })
}

function folderServerConfiguration() {
  return {
    authenticate: function(request) {
      return new Promise(function(resolve, reject) {
        if (request.getHeader("X-User"))
          resolve(true)
        else
          resolve(false)
      })
    },
  
    saveCommit: database.saveCommit.bind(database),
    fetchDocument: database.fetchDocument.bind(database)
  }
}

module.exports = function() {
  this.Given(/^the folder server test environment$/, function() {
    var world = this
    setupFolderDatabase()
    return faxdb.create(folderServerConfiguration()).then(function(fax) {
      world.fax = fax
    })
  })

  this.Given(
    /^there is a folder named "([^"]*)" with id "([^"]*)"$/,
    function(name, id) {
      var operations = [{ type: "rename", payload: name }]
      database.setDocument(id, {
        commits: [
          {
            parent: null,
            operations: operations,
          }
        ]
      })
    }
  )
  
  this.When(/^I am logged in as John$/, function() {
    delete this.response
    this.request = {
      headers: {
        "X-User": "john"
      }
    }
  })

  this.When(/^I make an unauthenticated request$/, function() {
    delete this.response
    this.request = {}
  })
  
  this.When(/^I request the document "([^"]*)"$/, function(id) {
    this.request.method = "GET"
    this.request.url = "/" + id
  })

  this.When(/^I request the URL "([^"]*)"$/, function(url) {
    this.request.method = "GET"
    this.request.url = url
  })

  this.When(
    /^I request an update to "([^"]*)" with operations:$/,
    function(id, table) {
      var commits = database.getDocument(id).commits
      var parent = commits[commits.length - 1]
      var operations = tableToOperations(table)

      var body = JSON.stringify({
        commit: {
          parent: faxdb.hash(parent),
          operations: operations
        }
      })

      this.request.method = "POST"
      this.request.url = "/" + id
      this.request.buffer = new Buffer(body)
    }
  )
  
  this.When(
    /^I request a conflicting update to "([^"]*)" with operations:$/,
    function(id, table) {
      var commits = database.getDocument(id).commits
      var parent = commits[commits.length - 1]
      var operations = tableToOperations(table)
      var body = JSON.stringify({
        commit: {
          parent: faxdb.hash({
            parent: parent,
            operations: [{ type: "bogus" }]
          }),
          operations: operations,
        }
      })

      this.request.method = "POST"
      this.request.url = "/" + id
      this.request.buffer = new Buffer(body)
    }
  )
  
  this.When(
    /^I request a bogus update to "([^"]*)"$/,
    function(id) {
      var body = JSON.stringify({
        bogus: "nonsense"
      })

      this.request.method = "POST"
      this.request.url = "/" + id
      this.request.buffer = new Buffer(body)
    }
  )
  
  this.Then(/^the response status is (\d+)$/, function(expectedStatus) {
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
            if (response.statusCode != 200) {
              console.warn(response._internal.buffer.toString())
            }
            reject(error)
          }
        }
      })
      world.fax(request, response)
    })
  })

  this.Then(
    /^the result is a folder document named "([^"]*)"$/,
    function(expectedName) {
      var result = this.getResult()
      assert.deepEqual(result.document.state, {
        name: expectedName
      })
    }
  )

  this.Then(
    /^the result has a hash that matches commits:$/,
    function(table) {
      var result = this.getResult()
      var commits = tableToCommitSequence(table)
      var hash = faxdb.hash(commits[commits.length - 1])
      assert.deepEqual(result.document.head, hash)
    }
  )

  this.Then(
    /^the document "([^"]+)" has commits:$/,
    function(id, table) {
      assert.deepEqual(
        database.getDocument(id).commits,
        tableToCommitSequence(table)
      )
    }
  )
}