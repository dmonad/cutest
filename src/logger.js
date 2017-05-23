
import jsondiffpatch from 'jsondiffpatch'
import { cloneDeep } from './helper.js'
import formatConsole from './consoleFormatter.js'

export default class Logger {
  constructor () {
    this.buffer = []
    this.failed = false
    this.errors = 0
  }
  fail () {
    this.failed = true
    this.errors++
  }
  log () {
    this.buffer.push({
      f: 'log',
      args: Array.prototype.slice.call(arguments)
    })
  }
  error () {
    this.fail()
    var args = Array.prototype.slice.call(arguments)
    if (typeof args[0] === 'string') {
      args[0] = '%c' + args[0]
      args.splice(1, 0, 'color:red')
    }
    args.push(new Error().stack)
    this.buffer.push({
      f: 'log',
      args: args
    })
  }
  assert (condition, output) {
    if (!condition) {
      this.fail()
    }
    this.buffer.push({
      f: 'log',
      args: [`%c${output}`, `color: ${condition ? 'green' : 'red'}`]
    })
  }
  group (f, ...args) {
    if (args.length === 0 || typeof args[0] !== 'string') {
      args.unshift('Group')
    }
    args[0] = '%c' + args[0]
    this.buffer.push({
      f: 'groupCollapsed',
      args: args
    })
    var eBeforeExecution = this.errors
    try {
      f()
    } catch (e) {
      this.fail()
      this.buffer.push({
        f: 'log',
        args: ['%cUncaught ' + e.stack, 'color:red']
      })
    }
    if (eBeforeExecution === this.errors) {
      args.splice(1, 0, '')
    } else {
      args.splice(1, 0, 'color: red')
    }
    this.buffer.push({
      f: 'groupEnd'
    })
  }
  async asyncGroup (f, ...args) {
    if (args.length === 0 || typeof args[0] !== 'string') {
      args.unshift('Group')
    }
    args[0] = '%c' + args[0]
    this.buffer.push({
      f: 'groupCollapsed',
      args: args
    })
    var eBeforeExecution = this.errors
    try {
      await f()
    } catch (e) {
      this.fail()
      this.buffer.push({
        f: 'log',
        args: ['%cUncaught ' + e.stack, 'color:red']
      })
    }
    if (eBeforeExecution === this.errors) {
      args.splice(1, 0, '')
    } else {
      args.splice(1, 0, 'color: red')
    }
    this.buffer.push({
      f: 'groupEnd'
    })
  }
  compare (o1, o2, name) {
    var arg1 = typeof o1 === 'string' ? `"${o1}"` : cloneDeep(o1)
    var arg2 = typeof o2 === 'string' ? `"${o2}"` : cloneDeep(o2)
    this.group(() => {
      var delta = jsondiffpatch.diff(o1, o2)
      var res = formatConsole(delta, o1)
      if (!res.match) {
        this.fail()
      }
      this.log.apply(this, res.logArguments)
    }, name, arg1, arg2)
  }
}
