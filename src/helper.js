/* global location */

import queryString from 'query-string'

export function cloneDeep (o) { return JSON.parse(JSON.stringify(o)) }

export const browserSupport =
  console.group != null

export function createTestLink (params) {
  if (typeof location !== 'undefined') {
    var query = queryString.parse(location.search)
    delete query.test
    delete query.seed
    delete query.args
    delete query.repeat
    for (var name in params) {
      if (params[name] != null) {
        query[name] = params[name]
      }
    }
    return location.protocol + '//' + location.host + location.pathname + '?' + queryString.stringify(query) + location.hash
  }
}
