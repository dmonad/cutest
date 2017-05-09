
import { diffJson, diffChars } from 'diff'
import state from './state.js'
import { createTestLink, testCompleted, browserSupport, cloneDeep } from './helper.js'

export default TestCase

class TestCase {
  constructor (testDescription, testFunction, valueGenerators) {
    this.valueGenerators = valueGenerators
    this.description = testDescription
    this.testFunction = testFunction
    if (testFunction.name == null) {
      throw new Error('Anonymous test functions are not allowed! Please name your test function')
    }
    this.name = testFunction.name
    if (state.tests[this.name] != null) {
      throw new Error(`A function with the same function name "${this.name}" was already provided! Please provide a unique function name`)
    }
    state.tests[this.name] = this
    this.failed = false
    this.errors = 0
    this.buffer = []
    this._seed = state.query.seed || null
    this.id = ++state.numberOfTests
  }
  fail () {
    this.failed = true
    this.errors++
  }
  run () {
    var __iterateOverGenerators = async (gens, args, argcase) => {
      if (gens.length === 0) {
        argcase.i++
        if (state.query.case == null || state.query.case === argcase.i) {
          var url = createTestLink({
            test: this.name,
            seed: this._seed,
            case: argcase.i
          })
          args.push(url)
          await this.asyncGroup(async () => {
            await this.testFunction(this, ...args)
          }, 'Arguments:', ...args)
        }
      } else {
        var gen = gens.shift()
        for (var arg of gen) {
          await __iterateOverGenerators(gens.slice(), args.slice().concat([arg]), argcase)
        }
      }
    }
    var __testStarter = () => {
      var test
      if (this.valueGenerators.length > 0) {
        test = __iterateOverGenerators(this.valueGenerators, [], { i: 0 })
      } else {
        test = this.testFunction(this)
      }
      test.then(() => {
        testCompleted(this)
      }, (err) => {
        this.fail()
        this.buffer.push({
          f: 'log',
          args: ['%cUncaught ' + err.stack, 'color: red']
        })
        testCompleted(this)
      })
    }
    setTimeout(__testStarter, 0)
  }
  getSeed () {
    if (this._seed == null) {
      this._seed = Math.random()
    }
    return this._seed
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
      var diff
      if (typeof o1 === 'string') {
        diff = diffChars(o1, o2)
      } else {
        diff = diffJson(o1, o2)
      }
      if (!(diff.length === 1 && diff[0].removed == null && diff[0].added == null)) {
        this.fail()
      }
      var print = ''
      var styles = []
      diff.forEach(function (d) {
        print += '%c' + d.value
        if (d.removed != null) {
          styles.push('background:red')
        } else if (d.added != null) {
          styles.push('background:lightgreen')
        } else {
          styles.push('')
        }
      })
      this.log.apply(this, [print].concat(styles))
    }, name, arg1, arg2)
  }
  print () {
    if (browserSupport) {
      var url = createTestLink({
        test: this.name,
        seed: this._seed
      })
      console.groupCollapsed(
        `%c${state.numberOfCompletedTests}/${state.numberOfTests}%c ${this.failed ? 'X' : '√'} ${this.description} %c${url}`,
        'font-weight: bold',
        `color: ${this.failed ? 'red' : 'green'}`,
        'color: grey; font-style: italic; font-size: xx-small'
      )
      this.buffer.forEach(function (b) {
        console[b.f].apply(console, b.args)
      })
      console.groupEnd()
    } else {
      console.log(
        `${state.numberOfCompletedTests}/${state.numberOfTests} ${this.failed ? 'X' : '√'} ${this.description}`
      )
    }
  }
}
