
Feature: The Fax server works correctly
  This specification references a test environment called the "folder
  server", which is a simple demo application involving users who add
  and remove items to folders.  The documents in the database
  represent folders.

  Scenario: Unknown document yields 404
    Given the folder server test environment
    When I make a request as John
    And the request is for the document "foo"
    Then the response status is 404
