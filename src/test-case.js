import { createTestLink, browserSupport } from './helper.js'
import testHandler from './test-handler.js'

import Logger from './logger.js'

class TestCase extends Logger {
  constructor (testDescription, testFunction, location, valueGenerators, opts) {
    super()
    this.valueGenerators = valueGenerators
    this.description = testDescription
    this.testFunction = testFunction
    this.location = location
    this.name = testFunction.name
    this._seed = null
    this.status = 'pending'
    this.opts = opts || {}
  }
  isRepeating () {
    return this._seed != null && testHandler.getRandomSeed() === null
  }
  isParallel () {
    return this.opts.parallel === true
  }
  clone () {
    return new TestCase(this.description, this.testFunction, this.valueGenerators, this.opts)
  }
  run () {
    this.status = 'running'
    var __iterateOverGenerators = async (gens, args, argcase) => {
      if (gens.length === 0) {
        argcase.i++
        if (testHandler.opts.case == null || testHandler.opts.case === argcase.i) {
          var url = createTestLink({
            test: this.name,
            seed: this._seed,
            case: argcase.i,
            repeat: this.isRepeating()
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
      test.then(async () => {
        this.status = 'done'
        await this.print()
        testHandler.testCompleted(this)
      }, async (err) => {
        this.status = 'done'
        this.failed = true
        this.buffer.push({
          f: 'log',
          args: ['%cUncaught ' + err.stack, 'color: red']
        })
        await this.print()
        testHandler.testCompleted(this)
      })
    }
    setTimeout(__testStarter, 0)
  }
  getSeed () {
    if (this._seed == null) {
      this._seed = testHandler.getRandomSeed() || Math.random()
    }
    return this._seed
  }
  async print () {
    if (browserSupport) {
      var url = createTestLink({
        test: this.name,
        seed: this._seed,
        repeat: false
      })
      console.groupCollapsed(
        `%c${testHandler.numberOfCompletedTests}/${testHandler.numberOfTests}%c ${this.failed ? 'X' : '√'} ${this.description}`,
        'font-weight: bold',
        `color: ${this.failed ? 'red' : 'green'}`
      )
      var location = await this.location
      console.log(`%cLocation: ${this.location.fileName}:${this.location.lineNumber}\nRun test again: ${url}`, 'color: grey; font-style: italic; font-size: x-small')
      this.buffer.forEach(function (b) {
        console[b.f].apply(console, b.args)
      })
      console.groupEnd()
    } else {
      console.log(
        `${testHandler.numberOfCompletedTests}/${testHandler.numberOfTests} ${this.failed ? 'X' : '√'} ${this.description}`
      )
    }
  }
}

export default TestCase
