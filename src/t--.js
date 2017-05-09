
import state from './state.js'
import TestCase from './testCase.js'

export { default as proxyConsole } from './proxyConsole.js'

export default function test (testDescription, ...args) {
  var testFunction = args.pop()
  if (state.query.test == null ||
    (testFunction.name != null && testFunction.name.indexOf(state.query.test) >= 0)
  ) {
    new TestCase(testDescription, testFunction, args).run()
  }
}
