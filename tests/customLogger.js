
import test, { proxyConsole } from '../src/cutest.js'
import debugLogger from 'debug'

proxyConsole()

debugLogger.enable('*')
var debug = debugLogger('customLogger')

test('Test proxied console with custom logger', async function customLogger1 (t) {
  debug('This is logged in the grouped container')
})
