
Feature: The Fax server works correctly
  This specification references a test environment called the "folder
  server", which is a simple demo application involving users who add
  and remove items to folders.  The documents in the database
  represent folders.

  Scenario: Unauthenticated request yields 403
    Given the folder server test environment
    When I make an unauthenticated request
    Then the response status is 403

  Scenario: Request for unknown document yields 404
    Given the folder server test environment
    When I make a request as John
    And the request is for the document "foo"
    Then the response status is 404

  Scenario: Request for bogus path yields 404
    Given the folder server test environment
    When there is a folder named "X" with id "1"
    When I make a request as John
    And the request is for the URL "/1/foo"
    Then the response status is 404

  Scenario: Request for empty folder yields correct state
    Given the folder server test environment
    When there is a folder named "TODO" with id "todo"
    And I make a request as John
    And the request is for the document "todo"
    Then the response status is 200
    And the result is a folder document named "TODO"

  Scenario: Request for empty folder yields correct hash
    Given the folder server test environment
    When there is a folder named "TODO" with id "todo"
    And I make a request as John
    And the request is for the document "todo"
    Then the response status is 200
    And the result has a hash that matches commits:
      | Type   | Payload |
      | rename | TODO    |

  Scenario: A folder can be renamed
    Given the folder server test environment
    When there is a folder named "TODO" with id "todo"
    And I make a request as John
    And the request is an update to "todo" with operations:
      | Type   | Payload |
      | rename | DONE    |
    Then the response status is 200
    And the document "todo" has commits:
      | Type   | Payload |
      | rename | TODO    |
      | rename | DONE    |

  Scenario: Conflict is detected
    Given the folder server test environment
    When there is a folder named "TODO" with id "todo"
    And I make a request as John
    And the request is a conflicting update to "todo" with operations:
      | Type   | Payload |
      | rename | DONE    |
    Then the response status is 409
    And the document "todo" has commits:
      | Type   | Payload |
      | rename | TODO    |

  Scenario: Bogus updates are detected
    Given the folder server test environment
    When there is a folder named "TODO" with id "todo"
    And I make a request as John
    And the request is a bogus update to "todo"
    Then the response status is 400
