import test, { proxyConsole } from '../src/cutest.js'
import Chance from 'chance'

proxyConsole()

function add (n1, n2) {
  while (n1 > 0) {
    n1--
    n2++
  }
  return n2
}

test(
  'Test possible edge cases', [0, 1, -1], [0, 1, 9],
  async function gen1 (t, n1, n2) {
    var res = add(n1, n2)
    t.assert(res === n1 + n2, 'add yields expected result')
    console.log('consoleProxy works in generated tests too')
    if (n1 === 0 && n2 === 0) {
      throw new Error('This error is to be expected')
    }
  }
)

test('Using chance.js', async function gen2 (t) {
  var chance = new Chance(t.getSeed())
  var n1 = chance.integer({min: 0, max: 100})
  var n2 = chance.integer({min: 0, max: 100})
  var res = add(n1, n2)

  t.assert(res === n1 + n2, 'add yields expected result for positive integers')
})
