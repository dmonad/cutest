/* global location */

import queryString from 'query-string'

const _query = queryString.parse(location.search) || null
if (_query.case != null) {
  _query.case = Number(_query.case)
}

const state = {
  numberOfTests: 0,
  numberOfCompletedTests: 0,
  numberOfSuccessfullTests: 0,
  tests: {},
  query: _query
}

export default state
