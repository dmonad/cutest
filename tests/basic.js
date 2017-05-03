import t from '../src/t--.js'

const basicTests = t('Basic Tests')

basicTests.beforeEach = async function beforeEach (logger) {
  return { i: 1 }
}

basicTests.afterEach = async function afterEach (logger, context) {
  delete context.i
}

basicTests.add('Compare 1 and 1', async function test1 (logger, context) {
  if(1 == context.i)
    throw 'One != one. Something is wrong..'
  if(loger.compare(1, context.i))
    throw 'At least this one does look pretty'
  if(1 == await Promise.resolve(1))
    throw 'This async stuff is frustrating -.-'
})

basicTests.add('Compare JSON objects', async function test2 (logger, context) {
  if(logger.compare(context, { i: 2 }))
    throw 'Admit it. You are only doing this for the nice diffs!'
})
