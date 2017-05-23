
import { test, proxyConsole } from '../src/cutest.js'

/*
 * Optionally, you can proxy console.* to output to the grouped log.
 * Supports console.log, console.error, console.assert
 */
proxyConsole()

test('Test proxied console', async function test4 (t) {
  t.log('This is logged in the grouped container')
  console.log(
    'console.log logs to the grouped container too, if proxy is enabled'
  )
})

test('Comparing 1 and 1', async function test1 (t) {
  t.assert(Number('1') === 1, '"1" equals 1')
  console.assert(Number('1') === 1, '"1" equals 1 (using console.assert)')
})

test('This one is gonna fail', async function test2 (t) {
  t.assert(Number('One') === 1, 'One equals 1')
  console.assert(Number('One') === 1, 'One equals 1 (using console.assert)')
  t.log('Assertions don\'t break the computation')
  throw new Error('Only Exceptions break the computation!')
})

test('Compare Json', async function test3 (t) {
  var o1 = { a: 1 }
  var o2 = { a: 1 }

  t.compare(o1, o2, 'Compare two Json objects')
  o1.b = 4
  t.compare(o1, o2, 'Compare two Json objects')
  t.compare({ a: 1, b: 2 }, {a: 1, b: 2, c: 4}, 'Compare two Json objects')
  t.compare('t-- rocks', 'rocks!', 'Compare two Strings')
})
