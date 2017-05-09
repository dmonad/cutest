
import { serialTest as test } from '../src/t--.js'

var serial1Executed = false

test('This is executed first', async function serial1 (t) {
  await new Promise(function wait (resolve) {
    setTimeout(resolve, 1000)
  })
  serial1Executed = true
  t.log('serial1 is finished')
})

test('This is executed next', async function serial2 (t) {
  t.assert(serial1Executed, 'serial1 is executed')
})
