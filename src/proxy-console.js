import testHandler from './test-handler.js'

export default function proxyConsole () {
  function createProxy (fName) {
    var originallog = console[fName]
    console[fName] = function consoleProxy () {
      var trace = new Error().stack.split('\n')
      var i = trace.length - 1
      while (i > 0 && trace[i].match((/^ {4}at (?:<anonymous>|__iterateOverGenerators|__testStarter|TestCase.*\.asyncGroup|asyncGroup).*/))) {
        i--
      }
      var hasTestName = trace[i]
        .match(/^ {4}at TestCase.*\.(\S+) .*/)
      if (hasTestName !== null) {
        var testcase = testHandler.tests[hasTestName[1]]
        testcase[fName].apply(testcase, arguments)
      } else {
        originallog.apply(console, arguments)
      }
    }
  }
  ['log', 'error', 'assert'].map(createProxy)
}
