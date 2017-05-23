
import { sequentialTest as test } from '../src/index.js'

var sequential1Executed = false

test('This is executed first', async function sequential1 (t) {
  await new Promise(function wait (resolve) {
    setTimeout(resolve, 1000)
  })
  sequential1Executed = true
  t.log('sequential1 is finished')
})

test('This is executed next', async function sequential2 (t) {
  t.assert(sequential1Executed, 'sequential1 is executed')
})
