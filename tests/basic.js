
import test from '../src/t--.js'

test('Comparing 1 and 1', async function test1 (t) {
  t.assert(Number('1') === 1, '"1" equals 1')
})

test('This one is gonna fail', async function test3 (t) {
  t.assert(Number('One') === 1, 'One equals 1')
  t.log('Assertions don\'t break the computation')
  throw new Error('Only Exceptions break the computation!')
})

test('Compare Json', async function test2 (t) {
  t.compare({ a: 1 }, { a: 1 }, 'Compare two Json objects')
  t.compare({ a: 1, b: 4 }, { a: 1 }, 'Compare two Json objects')
  t.compare('t-- rocks', 'rocks!', 'Compare two Strings')
})
