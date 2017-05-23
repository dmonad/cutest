
import state from './state.js'
import { createTestLink, browserSupport } from './helper.js'
import testHandler from './test-handler.js'

import Logger from './logger.js'

export default TestCase

class TestCase extends Logger {
  constructor (testDescription, testFunction, valueGenerators) {
    super()
    this.valueGenerators = valueGenerators
    this.description = testDescription
    this.testFunction = testFunction
    this.name = testFunction.name
    state.tests[this.name] = this
    this._seed = state.query.seed || null
    this.status = 'pending'
    this.success = null
    testHandler.register(this)
  }
  copy () {
    return new TestCase(this.testDescription, this.testFunction, this.valueGenerators)
  }
  run () {
    this.status = 'running'
    return new Promise((resolve, reject) => {
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
          this.status = 'done'
          this.success = true
          testHandler.testCompleted(this)
          resolve(this)
        }, (err) => {
          this.status = 'done'
          this.success = false
          this.buffer.push({
            f: 'log',
            args: ['%cUncaught ' + err.stack, 'color: red']
          })
          testCompleted(this)
          reject(this)
        })
      }
      setTimeout(__testStarter, 0)
    })
  }
  getSeed () {
    if (this._seed == null) {
      this._seed = Math.random()
      this._continue = true
    }
    return this._seed
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
