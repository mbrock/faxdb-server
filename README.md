
# Fax: a semi-centralized synchronization system

[![Circle CI](https://circleci.com/gh/mbrock/faxdb-server.svg?style=svg)](https://circleci.com/gh/mbrock/faxdb-server)

Fax is concerned with synchronizing facts in real-time among web
clients, using a central consensus server, and with eventual consistency
feeding some slower indexing database.

Technically, it's similar to a Git repository server, except made for
real-time web app synchronization via JSON.

## Values

1. Simplicity: it should be possible to understand, because if it breaks
   or misbehaves, your users will be immediately confused.

2. Correctness: the behavior of the system should be clear and
   well-defined, and there should be good reason to believe that the
   implementation does what it's supposed to.

3. Speed: the faster the entire network can synchronize, the better,
   though latency is optimized for quick acknowledgement to the user.

4. Portability: simple protocols and a basic implementation in
   plain JavaScript.

5. Offline-friendliness: the ability to do work without constant
   synchronization is good for robustness and speed and enables new
   use cases.

6. Transparency: the system should be easy to trace, analyze,
   and recover.

## Structure

A system instance consists of a server and a set of clients.
Each client is logged in as a user.  The server has many different
"documents" with universally unique identifiers.  Such a document is
defined by a sequence of committed operations, much like a Git
repository.

Initially, we will require these repositories to be linear, having no
branches, but relaxing that requirement is an interesting possibility.
We use Git-style content addressing to ensure integrity and ordering.
Thus clients may need to "rebase" their operations if their document has
changed, in effect pessimistic locking.  If the server has some
understanding of the semantics of a document, it can be told to
"auto-rebase" in specific ways, which reduces round-trips.

There is also a notion of state, defined for each document version by a
deterministic function applied iteratively to the operation sequence,
given an initial state.  This is so that clients can do a "shallow
clone" of a document by downloading its state and the hash of its most
recent commit.  When synchronizing later, they can request the operation
suffixes necessary to update their saved document states.

For example, a document representing a folder might consist of add and
remove operations, and the state is defined as the resulting folder.
The server caches that state in some way, so the client can just get the
latest folder contents.

## Protocol

The server exposes this API:

| Request                   | Input                  | Output                            | Content-Type      |
|---------------------------|------------------------|-----------------------------------|-------------------|
| `GET /`                   | ---                    | `{ [document]: { head, state } }` | application/json  |
| `GET /:document:`         | ---                    | `{ head, state }`                 | application/json  |
| `POST /:document:`        | `{ hash, operations }` | ---                               | application/json  |
| `GET /:document:/:hash:`  | ---                    | `{ head, operations }`            | text/event-stream |

The metavariable `head` is a cryptographic hash of the document,
described below.

The root path content is based on HTTP headers, which presumably are
added based by a proxy based on user authentication. For example
`X-User: john` makes the root return all the documents that user `john`
is interested in).

### Hashing

Hashing is based on the JSON representations of operations in a
well-defined and incremental way:

    f(operations, old-hash) = hash(old-hash ++ to-json(operations))

The `hash` function is SHA256 truncated to 160 bits, rendered as 40
characters of lowercase hexadecimal ASCII/UTF-8.  (Git hashes are
similar but with 40 chars of SHA1, which is considered feasibly
crackable, so SHA256/160 seems reasonable enough.)

### Inserting

A request to `POST /:document:` will be `200 OK` if the server accepts
and commits the provided hash and operations, judging them a valid
extension of the document.

If the server finds that the given hash is incorrect---i.e., not the
same as the server's calculation of `f(new-operations, old-hash)` (as
described above)---then the response status code is `409 Conflict`, and
the response body is, conveniently, the info needed for a client to
rebase: namely, the server's committed operation suffix after
`old-hash`, in the form `{ operations }`.

### Streaming

Not too complicated.

## Server Configuration

The server is library code.  You instantiate it with function parameters
for configuring:

1. how to retrieve all the documents relevant to a root request;
2. how to execute operations, by validating and (immutably) updating
   state;
3. how to load documents and update them transactionally (e.g. in memory
   or an RDBMS); and
4. how to store and load state.

```js
fax({
  pickDocuments,
  executeOperations,
  commitStore: {
    saveCommit,
    loadCommitSuffix,
  },
  stateStore: {
    saveState,
    loadState
  }
})
```

