const testSuites = []

export default function test (testSuiteName) {
  var testSuite = new TestSuite(testSuiteName)
  testSuites.push(testSuite)
  return testSuite
}

class TestSuite {
  constructor (name) {
    this.name = name
    var nop = async function nop () {}
    this.beforeEach = nop
    this.afterEach = nop
    this.tests = []
    this.running = false
  }
  add (name, testFunction) {
    this.tests.push([name, testFunction])
  }
  run () {
    if (!this.running) {
      this.running = true

    }
  }

}

class Test {
  constructor (testName, testFunction) {

  }
}

setTimeout(function testsuiteRunner() {
  var logger = tests.map(([testName]) => new TestLogger(testName))

  tests
  .map(async function runTests ([testName, testFunction], i) {
    var log = logger[i]
    var beforeEachContext = null
    if (test.beforeEach != null) {
      beforeEachContext = await test.beforeEach(log)
    }
    var testContext = await testFunction(log, beforeEachContext)
    if (test.afterEach != null) {
      await test.afterEach(log, testContext)
    }
  })
  .map((p, i) => {
    p.then(() => { logger[i]._success() }, (err) => { logger[i]._fail(err) })
  })
}, 0)

class TestLogger {
  constructor (testName) {
    this.testName = testName
    this.buffer = []
  }
  compare () {
    this.buffer.push('compare', arguments)
    return true
  }
  _success () {
    console.log('success', this.name)
    console.log(this.buffer)
    this.buffer = []
  }
  _fail () {
    console.log('fail', this.name)
    console.log(this.buffer)
    this.buffer = []
  }
}
