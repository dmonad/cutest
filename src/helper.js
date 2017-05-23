/* global location */

import queryString from 'query-string'
import state from './state.js'

export function cloneDeep (o) { return JSON.parse(JSON.stringify(o)) }

export const browserSupport =
  console.group != null

export function createTestLink (params) {
  if (typeof location !== 'undefined') {
    var query = JSON.parse(JSON.stringify(state.query))
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
}
