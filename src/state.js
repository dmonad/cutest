/* global location */

import queryString from 'query-string'

var _query

if (typeof location !== 'undefined') {
  _query = queryString.parse(location.search) || null
  if (_query.case != null) {
    _query.case = Number(_query.case)
  }
} else {
  _query = {}
}

const state = {
  numberOfTests: 0,
  numberOfCompletedTests: 0,
  numberOfSuccessfullTests: 0,
  tests: {},
  query: _query
}

export default state
