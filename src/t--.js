
import state from './state.js'
import TestCase from './testCase.js'

export { default as proxyConsole } from './proxyConsole.js'

function nop () {}

export default function test (testDescription, ...args) {
  var testFunction = args.pop()
  if (state.query.test == null ||
    (testFunction.name != null && testFunction.name.indexOf(state.query.test) >= 0)
  ) {
    return new TestCase(testDescription, testFunction, args).run().then(nop, nop)
  } else {
    return Promise.resolve()
  }
}

var serialTestChain = Promise.resolve()

export function serialTest (testDescription, ...args) {
  var testFunction = args.pop()
  if (state.query.test == null ||
    (testFunction.name != null && testFunction.name.indexOf(state.query.test) >= 0)
  ) {
    var testcase = new TestCase(testDescription, testFunction, args)
    var nextTest = function nextTest () {
      return testcase.run().then(nop, nop)
    }
    serialTestChain = serialTestChain.then(nextTest, nextTest)
  } else {
    return Promise.resolve()
  }
}
