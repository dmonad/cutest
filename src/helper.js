/* global location */

import queryString from 'query-string'
import state from './state.js'

export function cloneDeep (o) { return JSON.parse(JSON.stringify(o)) }

export const browserSupport =
  console.group != null

export function createTestLink (params) {
  var query = queryString.parse(location.search)
  delete query.test
  delete query.seed
  delete query.args
  for (var name in params) {
    if (params[name] != null) {
      query[name] = params[name]
    }
  }
  return location.protocol + '//' + location.host + location.pathname + '?' + queryString.stringify(query) + location.hash
}

export function testCompleted (test) {
  state.numberOfCompletedTests++
  if (!test.failed) {
    state.numberOfSuccessfullTests++
  }
  test.print()
  if (state.numberOfTests === state.numberOfCompletedTests) {
    if (state.numberOfTests === state.numberOfSuccessfullTests) {
      if (browserSupport) {
        console.log('\n%cAll tests passed!', 'colod:green; font-weight:bold')
        console.log('%c ',
          'font-size: 1px; padding: 60px 80px; background-size: 170px 120px; line-height: 120px; background-image: url(https://cloud.githubusercontent.com/assets/5553757/25725585/ee1e2ac0-3120-11e7-9401-323c153a99f1.gif)'
        )
      } else {
        console.log('\n -- All tests passed! --')
      }
    } else {
      if (browserSupport) {
        console.log(`\n%cPassed: ${state.numberOfSuccessfullTests} %cFailed: ${state.numberOfTests - state.numberOfSuccessfullTests}`, 'font-weight:bold; color: green', 'font-weight:bold; color:red')
      } else {
        console.log(`\nPassed: ${state.numberOfSuccessfullTests}\nFailed: ${state.numberOfTests - state.numberOfSuccessfullTests}`)
      }
    }
  }
}
