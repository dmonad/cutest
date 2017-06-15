
import TestCase from './test-case.js'
import testHandler from './test-handler.js'
import stacktrace from 'stacktrace-js'
window.stacktrace = stacktrace

export { default as proxyConsole } from './proxy-console.js'

export function test (testDescription, ...args) {
  let location = stacktrace.getSync()[1]
  var testFunction = args.pop()
  var testCase = new TestCase(testDescription, testFunction, location, args, { parallel: true })
  testHandler.register(testCase)
}

export function sequentialTest (testDescription, ...args) {
  var location = stacktrace.getSync()[1]
  var testFunction = args.pop()
  var testCase = new TestCase(testDescription, testFunction, location, args)
  testHandler.register(testCase)
}
