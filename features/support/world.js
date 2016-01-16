module.exports = function () {
  this.World = function World () {
    this.getResult = function () {
      var text = this.response._internal.buffer.toString()
      try {      
        var json = JSON.parse(text)
        return json
      } catch (e) {
        throw new Error("Failed to parse JSON: " + JSON.stringify(text))
      }
    }
  }
}
