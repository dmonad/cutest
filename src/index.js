
import state from './state.js'
import TestCase from './test-case.js'
import testHandler from './test-handler.js'

export { default as proxyConsole } from './proxy-console.js'

export function test (testDescription, ...args) {
  var testFunction = args.pop()
  var testCase = new TestCase(testDescription, testFunction, args, { parallel: true })
  testHandler.register(testCase)
}

export function sequentialTest (testDescription, ...args) {
  var testFunction = args.pop()
  var testCase = new TestCase(testDescription, testFunction, args, { parallel: true })
  testHandler.register(testCase)
}
