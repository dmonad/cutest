
import { diffJson, diffChars } from 'diff'

var numberOfTests = 0
var numberOfCompletedTests = 0
var numberOfSuccessfullTests = 0

const browserSupport =
  console.group != null

export default async function test (testName, testFunction) {
  numberOfTests++
  let logger = new TestCase(testName)
  try {
    await testFunction(logger)
  } catch (e) {
    logger.error(e.toString())
  }
  numberOfCompletedTests++
  logger.print()
  if (!logger.failed) {
    numberOfSuccessfullTests++
  }
  if (numberOfTests === numberOfCompletedTests) {
    if (numberOfTests === numberOfSuccessfullTests) {
      if (browserSupport) {
        console.log('\n%cAll tests passed!', 'colod:green; font-weight:bold')
        console.log('%c ',
          'font-size: 1px; padding: 60px 80px; background-size: 170px 120px; line-height: 120px; background-image: url(https://cloud.githubusercontent.com/assets/5553757/25725585/ee1e2ac0-3120-11e7-9401-323c153a99f1.gif)'
        )
      } else {
        console.log('\n -- All tests passed! --')
      }
    } else {
      if (browserSupport) {
        console.log(`\n%cPassed: ${numberOfSuccessfullTests} %cFailed: ${numberOfTests - numberOfSuccessfullTests}`, 'font-weight:bold; color: green', 'font-weight:bold; color:red')
      } else {
        console.log(`\nPassed: ${numberOfSuccessfullTests}\nFailed: ${numberOfTests - numberOfSuccessfullTests}`)
      }
    }
  }
}

class TestCase {
  constructor (testName) {
    this.testName = testName
    this.failed = false
    this.buffer = []
  }
  log () {
    this.buffer.push({
      f: 'log',
      args: Array.prototype.slice.call(arguments)
    })
  }
  error () {
    this.failed = true
    this.buffer.push({
      f: 'error',
      args: Array.prototype.slice.call(arguments)
    })
  }
  assert (condition, output) {
    if (!condition) {
      this.failed = true
    }
    this.buffer.push({
      f: 'log',
      args: [`%c${output}`, `color: ${condition ? 'green' : 'red'}`]
    })
  }
  group (f, ...args) {
    this.buffer.push({
      f: 'groupCollapsed',
      args: args
    })
    try {
      f()
    } catch (e) {
      this.error(e + '')
    }
    this.buffer.push({
      f: 'groupEnd'
    })
  }
  compare (o1, o2, name) {
    var diff
    if (typeof o1 === 'string') {
      diff = diffChars(o1, o2)
    } else {
      diff = diffJson(o1, o2)
    }
    var color
    if (!(diff.length === 1 && diff[0].removed == null && diff[0].added == null)) {
      color = 'red'
      this.failed = true
    }

    this.group(async () => {
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
    }, '%c' + name, 'color:' + color, o1, o2)
  }
  print () {
    if (browserSupport) {
      console.groupCollapsed(
        `%c${numberOfCompletedTests}/${numberOfTests}%c ${this.failed ? 'X' : '√'} ${this.testName}`,
        'font-weight: bold',
        `color: ${this.failed ? 'red' : 'green'}`
      )
      this.buffer.forEach(function (b) {
        console[b.f].apply(console, b.args)
      })
      console.groupEnd()
    } else {
      console.log(
        `${numberOfCompletedTests}/${numberOfTests} ${this.failed ? 'X' : '√'} ${this.testName}`
      )
    }
  }

}
