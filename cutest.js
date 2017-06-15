(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('stacktrace-js')) :
	typeof define === 'function' && define.amd ? define(['exports', 'stacktrace-js'], factory) :
	(factory((global.cutest = global.cutest || {}),global.stacktrace));
}(this, (function (exports,stacktrace) { 'use strict';

stacktrace = stacktrace && 'default' in stacktrace ? stacktrace['default'] : stacktrace;

var index$1 = function (str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
		return '%' + c.charCodeAt(0).toString(16).toUpperCase();
	});
};

/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

var index$3 = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

function encoderForArrayFormat(opts) {
	switch (opts.arrayFormat) {
		case 'index':
			return function (key, value, index) {
				return value === null ? [
					encode(key, opts),
					'[',
					index,
					']'
				].join('') : [
					encode(key, opts),
					'[',
					encode(index, opts),
					']=',
					encode(value, opts)
				].join('');
			};

		case 'bracket':
			return function (key, value) {
				return value === null ? encode(key, opts) : [
					encode(key, opts),
					'[]=',
					encode(value, opts)
				].join('');
			};

		default:
			return function (key, value) {
				return value === null ? encode(key, opts) : [
					encode(key, opts),
					'=',
					encode(value, opts)
				].join('');
			};
	}
}

function parserForArrayFormat(opts) {
	var result;

	switch (opts.arrayFormat) {
		case 'index':
			return function (key, value, accumulator) {
				result = /\[(\d*)\]$/.exec(key);

				key = key.replace(/\[\d*\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				}

				if (accumulator[key] === undefined) {
					accumulator[key] = {};
				}

				accumulator[key][result[1]] = value;
			};

		case 'bracket':
			return function (key, value, accumulator) {
				result = /(\[\])$/.exec(key);
				key = key.replace(/\[\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				} else if (accumulator[key] === undefined) {
					accumulator[key] = [value];
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};

		default:
			return function (key, value, accumulator) {
				if (accumulator[key] === undefined) {
					accumulator[key] = value;
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};
	}
}

function encode(value, opts) {
	if (opts.encode) {
		return opts.strict ? index$1(value) : encodeURIComponent(value);
	}

	return value;
}

function keysSorter(input) {
	if (Array.isArray(input)) {
		return input.sort();
	} else if (typeof input === 'object') {
		return keysSorter(Object.keys(input)).sort(function (a, b) {
			return Number(a) - Number(b);
		}).map(function (key) {
			return input[key];
		});
	}

	return input;
}

var extract = function (str) {
	return str.split('?')[1] || '';
};

var parse = function (str, opts) {
	opts = index$3({arrayFormat: 'none'}, opts);

	var formatter = parserForArrayFormat(opts);

	// Create an object with no prototype
	// https://github.com/sindresorhus/query-string/issues/47
	var ret = Object.create(null);

	if (typeof str !== 'string') {
		return ret;
	}

	str = str.trim().replace(/^(\?|#|&)/, '');

	if (!str) {
		return ret;
	}

	str.split('&').forEach(function (param) {
		var parts = param.replace(/\+/g, ' ').split('=');
		// Firefox (pre 40) decodes `%3D` to `=`
		// https://github.com/sindresorhus/query-string/pull/37
		var key = parts.shift();
		var val = parts.length > 0 ? parts.join('=') : undefined;

		// missing `=` should be `null`:
		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
		val = val === undefined ? null : decodeURIComponent(val);

		formatter(decodeURIComponent(key), val, ret);
	});

	return Object.keys(ret).sort().reduce(function (result, key) {
		var val = ret[key];
		if (Boolean(val) && typeof val === 'object' && !Array.isArray(val)) {
			// Sort object keys, not values
			result[key] = keysSorter(val);
		} else {
			result[key] = val;
		}

		return result;
	}, Object.create(null));
};

var stringify = function (obj, opts) {
	var defaults = {
		encode: true,
		strict: true,
		arrayFormat: 'none'
	};

	opts = index$3(defaults, opts);

	var formatter = encoderForArrayFormat(opts);

	return obj ? Object.keys(obj).sort().map(function (key) {
		var val = obj[key];

		if (val === undefined) {
			return '';
		}

		if (val === null) {
			return encode(key, opts);
		}

		if (Array.isArray(val)) {
			var result = [];

			val.slice().forEach(function (val2) {
				if (val2 === undefined) {
					return;
				}

				result.push(formatter(key, val2, result.length));
			});

			return result.join('&');
		}

		return encode(key, opts) + '=' + encode(val, opts);
	}).filter(function (x) {
		return x.length > 0;
	}).join('&') : '';
};

var index = {
	extract: extract,
	parse: parse,
	stringify: stringify
};

/* global location */

function cloneDeep (o) { return JSON.parse(JSON.stringify(o)) }

const browserSupport =
  console.group != null;

function createTestLink (params) {
  if (typeof location !== 'undefined') {
    var query = index.parse(location.search);
    delete query.test;
    delete query.seed;
    delete query.args;
    delete query.repeat;
    for (var name in params) {
      if (params[name] != null) {
        query[name] = params[name];
      }
    }
    return location.protocol + '//' + location.host + location.pathname + '?' + index.stringify(query) + location.hash
  }
}

/* globals location */

class TestHandler {
  constructor () {
    this.repeatingRun = 0;
    this.tests = {};
    if (typeof location !== 'undefined') {
      this.opts = index.parse(location.search);
      if (this.opts.case != null) {
        this.opts.case = Number(this.opts.case);
      }
      if (this.opts.repeat === 'true') {
        this.opts.repeat = true;
      } else if (this.opts.repeat === 'false') {
        this.opts.repeat = false;
      }
    } else {
      this.opts = {};
    }
    this.opts.repeat = this.opts.repeat !== false;
  }
  getRandomSeed () {
    return this.opts.seed || null
  }
  getTestList () {
    return Object.keys(this.tests).map(name => this.tests[name])
  }
  isTestRunnig () {
    return this.getTestList().some(test => test.status === 'running')
  }
  isSequentialTestRunning () {
    return this.getTestList().some(test => !test.isParallel() && test.status === 'running')
  }
  isParallelTestRunning () {
    return this.getTestList().some(test => test.isParallel() && test.status === 'running')
  }
  get numberOfTests () {
    return this.getTestList().length
  }
  get numberOfCompletedTests () {
    return this.getTestList().filter(test => test.status === 'done').length
  }
  get numberOfSuccessfullTests () {
    return this.getTestList().filter(test => test.failed === false && test.status === 'done').length
  }
  register (test) {
    if (test.name == null) {
      throw new Error(`
      Each test must be defined by a unique function name!
      E.g. \`test('test description', async function uniqueName () { .. })\`
      `
    )
    }
    if (this.tests[test.name] != null) {
      throw new Error(`
        Each test must be defined by a unique function name!
        => \`test('${test.description}', async function ${test.name} () { .. })\` is already registered!
        `
      )
    }
    if (this.opts.test == null || test.name.indexOf(this.opts.test) >= 0) {
      this.tests[test.name] = test;
      if (!this.isTestRunnig() || (test.isParallel() && this.isParallelTestRunning())) {
        // only if no test is running, or if parallel tests are already running
        test.run();
      }
    }
  }
  _runNextSequentialTest () {
    let nextSequential = this.getTestList().find(
      t => t.status === 'pending' && !t.isParallel()
    );
    if (nextSequential != null) {
      nextSequential.run();
      return true
    } else {
      return false
    }
  }
  _runNextParallelTests () {
    let nextParallels = this.getTestList().filter(
      t => t.status === 'pending' && t.isParallel()
    );
    if (nextParallels.length > 0) {
      nextParallels.map(t => t.run());
      return true
    } else {
      return false
    }
  }
  testCompleted (test) {
    this._runNextParallelTests();
    if (!this.isTestRunnig()) {
      this._runNextSequentialTest();
      if (!this.isSequentialTestRunning()) {
        this.done();
      }
    }
  }
  _runRepeatingTests () {
    let repeatingTests = this.getTestList().filter(t => t.isRepeating());
    if (repeatingTests.length > 0 && this.opts.repeat) {
      this.repeatingRun++;
      console.log(`%cRunning ${repeatingTests.length} tests again because they use random values.. (${this.repeatingRun}. repeating run)`, 'font-weight:bold');
      this.tests = {};
      repeatingTests.forEach(t => {
        this.register(t.clone());
      });
      this.testCompleted();
    }
  }
  done () {
    if (this.numberOfTests === this.numberOfCompletedTests) {
      if (this.numberOfTests === this.numberOfSuccessfullTests) {
        if (browserSupport) {
          console.log('\n%cAll tests passed!', 'font-weight:bold');
          console.log('%c ',
            'font-size: 1px; padding: 60px 80px; background-size: 170px 120px; line-height: 120px; background-image: url(https://cloud.githubusercontent.com/assets/5553757/25725585/ee1e2ac0-3120-11e7-9401-323c153a99f1.gif)'
          );
          this._runRepeatingTests();
        } else {
          console.log('\n -- All tests passed! --');
        }
      } else {
        if (browserSupport) {
          console.log(`\n%cPassed: ${this.numberOfSuccessfullTests} %cFailed: ${this.numberOfTests - this.numberOfSuccessfullTests}`, 'font-weight:bold; color: green', 'font-weight:bold; color:red');
        } else {
          console.log(`\nPassed: ${this.numberOfSuccessfullTests}\nFailed: ${this.numberOfTests - this.numberOfSuccessfullTests}`);
        }
      }
    }
  }
}

const testHandler = new TestHandler();

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
}



function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var isBrowser = typeof index !== 'undefined';

var environment = {
	isBrowser: isBrowser
};

var Processor$1 = function Processor(options){
  this.selfOptions = options || {};
  this.pipes = {};
};

Processor$1.prototype.options = function(options) {
  if (options) {
    this.selfOptions = options;
  }
  return this.selfOptions;
};

Processor$1.prototype.pipe = function(name, pipe) {
  if (typeof name === 'string') {
    if (typeof pipe === 'undefined') {
      return this.pipes[name];
    } else {
      this.pipes[name] = pipe;
    }
  }
  if (name && name.name) {
    pipe = name;
    if (pipe.processor === this) { return pipe; }
    this.pipes[pipe.name] = pipe;
  }
  pipe.processor = this;
  return pipe;
};

Processor$1.prototype.process = function(input, pipe) {
  var context = input;
  context.options = this.options();
  var nextPipe = pipe || input.pipe || 'default';
  var lastPipe, lastContext;
  while (nextPipe) {
    if (typeof context.nextAfterChildren !== 'undefined') {
      // children processed and coming back to parent
      context.next = context.nextAfterChildren;
      context.nextAfterChildren = null;
    }

    if (typeof nextPipe === 'string') {
      nextPipe = this.pipe(nextPipe);
    }
    nextPipe.process(context);
    lastContext = context;
    lastPipe = nextPipe;
    nextPipe = null;
    if (context) {
      if (context.next) {
        context = context.next;
        nextPipe = lastContext.nextPipe || context.pipe || lastPipe;
      }
    }
  }
  return context.hasResult ? context.result : undefined;
};

var Processor_1 = Processor$1;

var processor = {
	Processor: Processor_1
};

var Pipe$1 = function Pipe(name) {
  this.name = name;
  this.filters = [];
};

Pipe$1.prototype.process = function(input) {
  if (!this.processor) {
    throw new Error('add this pipe to a processor before using it');
  }
  var debug = this.debug;
  var length = this.filters.length;
  var context = input;
  for (var index = 0; index < length; index++) {
    var filter = this.filters[index];
    if (debug) {
      this.log('filter: ' + filter.filterName);
    }
    filter(context);
    if (typeof context === 'object' && context.exiting) {
      context.exiting = false;
      break;
    }
  }
  if (!context.next && this.resultCheck) {
    this.resultCheck(context);
  }
};

Pipe$1.prototype.log = function(msg) {
  console.log('[jsondiffpatch] ' + this.name + ' pipe, ' + msg);
};

Pipe$1.prototype.append = function() {
  this.filters.push.apply(this.filters, arguments);
  return this;
};

Pipe$1.prototype.prepend = function() {
  this.filters.unshift.apply(this.filters, arguments);
  return this;
};

Pipe$1.prototype.indexOf = function(filterName) {
  if (!filterName) {
    throw new Error('a filter name is required');
  }
  for (var index = 0; index < this.filters.length; index++) {
    var filter = this.filters[index];
    if (filter.filterName === filterName) {
      return index;
    }
  }
  throw new Error('filter not found: ' + filterName);
};

Pipe$1.prototype.list = function() {
  var names = [];
  for (var index = 0; index < this.filters.length; index++) {
    var filter = this.filters[index];
    names.push(filter.filterName);
  }
  return names;
};

Pipe$1.prototype.after = function(filterName) {
  var index = this.indexOf(filterName);
  var params = Array.prototype.slice.call(arguments, 1);
  if (!params.length) {
    throw new Error('a filter is required');
  }
  params.unshift(index + 1, 0);
  Array.prototype.splice.apply(this.filters, params);
  return this;
};

Pipe$1.prototype.before = function(filterName) {
  var index = this.indexOf(filterName);
  var params = Array.prototype.slice.call(arguments, 1);
  if (!params.length) {
    throw new Error('a filter is required');
  }
  params.unshift(index, 0);
  Array.prototype.splice.apply(this.filters, params);
  return this;
};

Pipe$1.prototype.clear = function() {
  this.filters.length = 0;
  return this;
};

Pipe$1.prototype.shouldHaveResult = function(should) {
  if (should === false) {
    this.resultCheck = null;
    return;
  }
  if (this.resultCheck) {
    return;
  }
  var pipe = this;
  this.resultCheck = function(context) {
    if (!context.hasResult) {
      console.log(context);
      var error = new Error(pipe.name + ' failed');
      error.noResult = true;
      throw error;
    }
  };
  return this;
};

var Pipe_1 = Pipe$1;

var pipe = {
	Pipe: Pipe_1
};

var Pipe$2 = pipe.Pipe;

var Context$1 = function Context(){
};

Context$1.prototype.setResult = function(result) {
	this.result = result;
	this.hasResult = true;
	return this;
};

Context$1.prototype.exit = function() {
	this.exiting = true;
	return this;
};

Context$1.prototype.switchTo = function(next, pipe$$1) {
	if (typeof next === 'string' || next instanceof Pipe$2) {
		this.nextPipe = next;
	} else {
		this.next = next;
		if (pipe$$1) {
			this.nextPipe = pipe$$1;
		}
	}
	return this;
};

Context$1.prototype.push = function(child, name) {
	child.parent = this;
	if (typeof name !== 'undefined') {
		child.childName = name;
	}
	child.root = this.root || this;
	child.options = child.options || this.options;
	if (!this.children) {
		this.children = [child];
		this.nextAfterChildren = this.next || null;
		this.next = child;
	} else {
		this.children[this.children.length - 1].next = child;
		this.children.push(child);
	}
	child.next = this;
	return this;
};

var Context_1 = Context$1;

var context = {
	Context: Context_1
};

var isArray = (typeof Array.isArray === 'function') ?
  // use native function
  Array.isArray :
  // use instanceof operator
  function(a) {
    return a instanceof Array;
  };

function cloneRegExp(re) {
  var regexMatch = /^\/(.*)\/([gimyu]*)$/.exec(re.toString());
  return new RegExp(regexMatch[1], regexMatch[2]);
}

function clone(arg) {
  if (typeof arg !== 'object') {
    return arg;
  }
  if (arg === null) {
    return null;
  }
  if (isArray(arg)) {
    return arg.map(clone);
  }
  if (arg instanceof Date) {
    return new Date(arg.getTime());
  }
  if (arg instanceof RegExp) {
    return cloneRegExp(arg);
  }
  var cloned = {};
  for (var name in arg) {
    if (Object.prototype.hasOwnProperty.call(arg, name)) {
      cloned[name] = clone(arg[name]);
    }
  }
  return cloned;
}

var clone_1 = clone;

var Context = context.Context;


var DiffContext$1 = function DiffContext(left, right) {
  this.left = left;
  this.right = right;
  this.pipe = 'diff';
};

DiffContext$1.prototype = new Context();

DiffContext$1.prototype.setResult = function(result) {
  if (this.options.cloneDiffValues && typeof result === 'object') {
    var clone = typeof this.options.cloneDiffValues === 'function' ?
      this.options.cloneDiffValues : clone_1;
    if (typeof result[0] === 'object') {
      result[0] = clone(result[0]);
    }
    if (typeof result[1] === 'object') {
      result[1] = clone(result[1]);
    }
  }
  return Context.prototype.setResult.apply(this, arguments);
};

var DiffContext_1 = DiffContext$1;

var diff = {
	DiffContext: DiffContext_1
};

var Context$2 = context.Context;

var PatchContext$1 = function PatchContext(left, delta) {
  this.left = left;
  this.delta = delta;
  this.pipe = 'patch';
};

PatchContext$1.prototype = new Context$2();

var PatchContext_1 = PatchContext$1;

var patch = {
	PatchContext: PatchContext_1
};

var Context$3 = context.Context;

var ReverseContext$1 = function ReverseContext(delta) {
  this.delta = delta;
  this.pipe = 'reverse';
};

ReverseContext$1.prototype = new Context$3();

var ReverseContext_1 = ReverseContext$1;

var reverse = {
	ReverseContext: ReverseContext_1
};

var isArray$1 = (typeof Array.isArray === 'function') ?
  // use native function
  Array.isArray :
  // use instanceof operator
  function(a) {
    return a instanceof Array;
  };

var diffFilter = function trivialMatchesDiffFilter(context) {
  if (context.left === context.right) {
    context.setResult(undefined).exit();
    return;
  }
  if (typeof context.left === 'undefined') {
    if (typeof context.right === 'function') {
      throw new Error('functions are not supported');
    }
    context.setResult([context.right]).exit();
    return;
  }
  if (typeof context.right === 'undefined') {
    context.setResult([context.left, 0, 0]).exit();
    return;
  }
  if (typeof context.left === 'function' || typeof context.right === 'function') {
    throw new Error('functions are not supported');
  }
  context.leftType = context.left === null ? 'null' : typeof context.left;
  context.rightType = context.right === null ? 'null' : typeof context.right;
  if (context.leftType !== context.rightType) {
    context.setResult([context.left, context.right]).exit();
    return;
  }
  if (context.leftType === 'boolean' || context.leftType === 'number') {
    context.setResult([context.left, context.right]).exit();
    return;
  }
  if (context.leftType === 'object') {
    context.leftIsArray = isArray$1(context.left);
  }
  if (context.rightType === 'object') {
    context.rightIsArray = isArray$1(context.right);
  }
  if (context.leftIsArray !== context.rightIsArray) {
    context.setResult([context.left, context.right]).exit();
    return;
  }

  if (context.left instanceof RegExp) {
    if (context.right instanceof RegExp) {
      context.setResult([context.left.toString(), context.right.toString()]).exit();
    } else {
      context.setResult([context.left, context.right]).exit();
      return;
    }
  }
};
diffFilter.filterName = 'trivial';

var patchFilter = function trivialMatchesPatchFilter(context) {
  if (typeof context.delta === 'undefined') {
    context.setResult(context.left).exit();
    return;
  }
  context.nested = !isArray$1(context.delta);
  if (context.nested) {
    return;
  }
  if (context.delta.length === 1) {
    context.setResult(context.delta[0]).exit();
    return;
  }
  if (context.delta.length === 2) {
    if (context.left instanceof RegExp) {
      var regexArgs = /^\/(.*)\/([gimyu]+)$/.exec(context.delta[1]);
      if (regexArgs) {
        context.setResult(new RegExp(regexArgs[1], regexArgs[2])).exit();
        return;
      }
    }
    context.setResult(context.delta[1]).exit();
    return;
  }
  if (context.delta.length === 3 && context.delta[2] === 0) {
    context.setResult(undefined).exit();
    return;
  }
};
patchFilter.filterName = 'trivial';

var reverseFilter = function trivialReferseFilter(context) {
  if (typeof context.delta === 'undefined') {
    context.setResult(context.delta).exit();
    return;
  }
  context.nested = !isArray$1(context.delta);
  if (context.nested) {
    return;
  }
  if (context.delta.length === 1) {
    context.setResult([context.delta[0], 0, 0]).exit();
    return;
  }
  if (context.delta.length === 2) {
    context.setResult([context.delta[1], context.delta[0]]).exit();
    return;
  }
  if (context.delta.length === 3 && context.delta[2] === 0) {
    context.setResult([context.delta[0]]).exit();
    return;
  }
};
reverseFilter.filterName = 'trivial';

var diffFilter_1 = diffFilter;
var patchFilter_1 = patchFilter;
var reverseFilter_1 = reverseFilter;

var trivial = {
	diffFilter: diffFilter_1,
	patchFilter: patchFilter_1,
	reverseFilter: reverseFilter_1
};

var DiffContext$2 = diff.DiffContext;
var PatchContext$2 = patch.PatchContext;
var ReverseContext$2 = reverse.ReverseContext;

var collectChildrenDiffFilter = function collectChildrenDiffFilter(context) {
  if (!context || !context.children) {
    return;
  }
  var length = context.children.length;
  var child;
  var result = context.result;
  for (var index = 0; index < length; index++) {
    child = context.children[index];
    if (typeof child.result === 'undefined') {
      continue;
    }
    result = result || {};
    result[child.childName] = child.result;
  }
  if (result && context.leftIsArray) {
    result._t = 'a';
  }
  context.setResult(result).exit();
};
collectChildrenDiffFilter.filterName = 'collectChildren';

var objectsDiffFilter = function objectsDiffFilter(context) {
  if (context.leftIsArray || context.leftType !== 'object') {
    return;
  }

  var name, child, propertyFilter = context.options.propertyFilter;
  for (name in context.left) {
    if (!Object.prototype.hasOwnProperty.call(context.left, name)) {
      continue;
    }
    if (propertyFilter && !propertyFilter(name, context)) {
      continue;
    }
    child = new DiffContext$2(context.left[name], context.right[name]);
    context.push(child, name);
  }
  for (name in context.right) {
    if (!Object.prototype.hasOwnProperty.call(context.right, name)) {
      continue;
    }
    if (propertyFilter && !propertyFilter(name, context)) {
      continue;
    }
    if (typeof context.left[name] === 'undefined') {
      child = new DiffContext$2(undefined, context.right[name]);
      context.push(child, name);
    }
  }

  if (!context.children || context.children.length === 0) {
    context.setResult(undefined).exit();
    return;
  }
  context.exit();
};
objectsDiffFilter.filterName = 'objects';

var patchFilter$1 = function nestedPatchFilter(context) {
  if (!context.nested) {
    return;
  }
  if (context.delta._t) {
    return;
  }
  var name, child;
  for (name in context.delta) {
    child = new PatchContext$2(context.left[name], context.delta[name]);
    context.push(child, name);
  }
  context.exit();
};
patchFilter$1.filterName = 'objects';

var collectChildrenPatchFilter = function collectChildrenPatchFilter(context) {
  if (!context || !context.children) {
    return;
  }
  if (context.delta._t) {
    return;
  }
  var length = context.children.length;
  var child;
  for (var index = 0; index < length; index++) {
    child = context.children[index];
    if (Object.prototype.hasOwnProperty.call(context.left, child.childName) && child.result === undefined) {
      delete context.left[child.childName];
    } else if (context.left[child.childName] !== child.result) {
      context.left[child.childName] = child.result;
    }
  }
  context.setResult(context.left).exit();
};
collectChildrenPatchFilter.filterName = 'collectChildren';

var reverseFilter$1 = function nestedReverseFilter(context) {
  if (!context.nested) {
    return;
  }
  if (context.delta._t) {
    return;
  }
  var name, child;
  for (name in context.delta) {
    child = new ReverseContext$2(context.delta[name]);
    context.push(child, name);
  }
  context.exit();
};
reverseFilter$1.filterName = 'objects';

var collectChildrenReverseFilter = function collectChildrenReverseFilter(context) {
  if (!context || !context.children) {
    return;
  }
  if (context.delta._t) {
    return;
  }
  var length = context.children.length;
  var child;
  var delta = {};
  for (var index = 0; index < length; index++) {
    child = context.children[index];
    if (delta[child.childName] !== child.result) {
      delta[child.childName] = child.result;
    }
  }
  context.setResult(delta).exit();
};
collectChildrenReverseFilter.filterName = 'collectChildren';

var collectChildrenDiffFilter_1 = collectChildrenDiffFilter;
var objectsDiffFilter_1 = objectsDiffFilter;
var patchFilter_1$1 = patchFilter$1;
var collectChildrenPatchFilter_1 = collectChildrenPatchFilter;
var reverseFilter_1$1 = reverseFilter$1;
var collectChildrenReverseFilter_1 = collectChildrenReverseFilter;

var nested = {
	collectChildrenDiffFilter: collectChildrenDiffFilter_1,
	objectsDiffFilter: objectsDiffFilter_1,
	patchFilter: patchFilter_1$1,
	collectChildrenPatchFilter: collectChildrenPatchFilter_1,
	reverseFilter: reverseFilter_1$1,
	collectChildrenReverseFilter: collectChildrenReverseFilter_1
};

/*

LCS implementation that supports arrays or strings

reference: http://en.wikipedia.org/wiki/Longest_common_subsequence_problem

*/

var defaultMatch = function(array1, array2, index1, index2) {
  return array1[index1] === array2[index2];
};

var lengthMatrix = function(array1, array2, match, context) {
  var len1 = array1.length;
  var len2 = array2.length;
  var x, y;

  // initialize empty matrix of len1+1 x len2+1
  var matrix = [len1 + 1];
  for (x = 0; x < len1 + 1; x++) {
    matrix[x] = [len2 + 1];
    for (y = 0; y < len2 + 1; y++) {
      matrix[x][y] = 0;
    }
  }
  matrix.match = match;
  // save sequence lengths for each coordinate
  for (x = 1; x < len1 + 1; x++) {
    for (y = 1; y < len2 + 1; y++) {
      if (match(array1, array2, x - 1, y - 1, context)) {
        matrix[x][y] = matrix[x - 1][y - 1] + 1;
      } else {
        matrix[x][y] = Math.max(matrix[x - 1][y], matrix[x][y - 1]);
      }
    }
  }
  return matrix;
};

var backtrack = function(matrix, array1, array2, index1, index2, context) {
  if (index1 === 0 || index2 === 0) {
    return {
      sequence: [],
      indices1: [],
      indices2: []
    };
  }

  if (matrix.match(array1, array2, index1 - 1, index2 - 1, context)) {
    var subsequence = backtrack(matrix, array1, array2, index1 - 1, index2 - 1, context);
    subsequence.sequence.push(array1[index1 - 1]);
    subsequence.indices1.push(index1 - 1);
    subsequence.indices2.push(index2 - 1);
    return subsequence;
  }

  if (matrix[index1][index2 - 1] > matrix[index1 - 1][index2]) {
    return backtrack(matrix, array1, array2, index1, index2 - 1, context);
  } else {
    return backtrack(matrix, array1, array2, index1 - 1, index2, context);
  }
};

var get = function(array1, array2, match, context) {
  context = context || {};
  var matrix = lengthMatrix(array1, array2, match || defaultMatch, context);
  var result = backtrack(matrix, array1, array2, array1.length, array2.length, context);
  if (typeof array1 === 'string' && typeof array2 === 'string') {
    result.sequence = result.sequence.join('');
  }
  return result;
};

var get_1 = get;

var lcs = {
	get: get_1
};

var DiffContext$3 = diff.DiffContext;
var PatchContext$3 = patch.PatchContext;
var ReverseContext$3 = reverse.ReverseContext;



var ARRAY_MOVE = 3;

var isArray$2 = (typeof Array.isArray === 'function') ?
  // use native function
  Array.isArray :
  // use instanceof operator
  function(a) {
    return a instanceof Array;
  };

var arrayIndexOf = typeof Array.prototype.indexOf === 'function' ?
  function(array, item) {
    return array.indexOf(item);
  } : function(array, item) {
    var length = array.length;
    for (var i = 0; i < length; i++) {
      if (array[i] === item) {
        return i;
      }
    }
    return -1;
  };

function arraysHaveMatchByRef(array1, array2, len1, len2) {
  for (var index1 = 0; index1 < len1; index1++) {
    var val1 = array1[index1];
    for (var index2 = 0; index2 < len2; index2++) {
      var val2 = array2[index2];
      if (index1 !== index2 && val1 === val2) {
        return true;
      }
    }
  }
}

function matchItems(array1, array2, index1, index2, context) {
  var value1 = array1[index1];
  var value2 = array2[index2];
  if (value1 === value2) {
    return true;
  }
  if (typeof value1 !== 'object' || typeof value2 !== 'object') {
    return false;
  }
  var objectHash = context.objectHash;
  if (!objectHash) {
    // no way to match objects was provided, try match by position
    return context.matchByPosition && index1 === index2;
  }
  var hash1;
  var hash2;
  if (typeof index1 === 'number') {
    context.hashCache1 = context.hashCache1 || [];
    hash1 = context.hashCache1[index1];
    if (typeof hash1 === 'undefined') {
      context.hashCache1[index1] = hash1 = objectHash(value1, index1);
    }
  } else {
    hash1 = objectHash(value1);
  }
  if (typeof hash1 === 'undefined') {
    return false;
  }
  if (typeof index2 === 'number') {
    context.hashCache2 = context.hashCache2 || [];
    hash2 = context.hashCache2[index2];
    if (typeof hash2 === 'undefined') {
      context.hashCache2[index2] = hash2 = objectHash(value2, index2);
    }
  } else {
    hash2 = objectHash(value2);
  }
  if (typeof hash2 === 'undefined') {
    return false;
  }
  return hash1 === hash2;
}

var diffFilter$1 = function arraysDiffFilter(context) {
  if (!context.leftIsArray) {
    return;
  }

  var matchContext = {
    objectHash: context.options && context.options.objectHash,
    matchByPosition: context.options && context.options.matchByPosition
  };
  var commonHead = 0;
  var commonTail = 0;
  var index;
  var index1;
  var index2;
  var array1 = context.left;
  var array2 = context.right;
  var len1 = array1.length;
  var len2 = array2.length;

  var child;

  if (len1 > 0 && len2 > 0 && !matchContext.objectHash &&
    typeof matchContext.matchByPosition !== 'boolean') {
    matchContext.matchByPosition = !arraysHaveMatchByRef(array1, array2, len1, len2);
  }

  // separate common head
  while (commonHead < len1 && commonHead < len2 &&
    matchItems(array1, array2, commonHead, commonHead, matchContext)) {
    index = commonHead;
    child = new DiffContext$3(context.left[index], context.right[index]);
    context.push(child, index);
    commonHead++;
  }
  // separate common tail
  while (commonTail + commonHead < len1 && commonTail + commonHead < len2 &&
    matchItems(array1, array2, len1 - 1 - commonTail, len2 - 1 - commonTail, matchContext)) {
    index1 = len1 - 1 - commonTail;
    index2 = len2 - 1 - commonTail;
    child = new DiffContext$3(context.left[index1], context.right[index2]);
    context.push(child, index2);
    commonTail++;
  }
  var result;
  if (commonHead + commonTail === len1) {
    if (len1 === len2) {
      // arrays are identical
      context.setResult(undefined).exit();
      return;
    }
    // trivial case, a block (1 or more consecutive items) was added
    result = result || {
      _t: 'a'
    };
    for (index = commonHead; index < len2 - commonTail; index++) {
      result[index] = [array2[index]];
    }
    context.setResult(result).exit();
    return;
  }
  if (commonHead + commonTail === len2) {
    // trivial case, a block (1 or more consecutive items) was removed
    result = result || {
      _t: 'a'
    };
    for (index = commonHead; index < len1 - commonTail; index++) {
      result['_' + index] = [array1[index], 0, 0];
    }
    context.setResult(result).exit();
    return;
  }
  // reset hash cache
  delete matchContext.hashCache1;
  delete matchContext.hashCache2;

  // diff is not trivial, find the LCS (Longest Common Subsequence)
  var trimmed1 = array1.slice(commonHead, len1 - commonTail);
  var trimmed2 = array2.slice(commonHead, len2 - commonTail);
  var seq = lcs.get(
    trimmed1, trimmed2,
    matchItems,
    matchContext
  );
  var removedItems = [];
  result = result || {
    _t: 'a'
  };
  for (index = commonHead; index < len1 - commonTail; index++) {
    if (arrayIndexOf(seq.indices1, index - commonHead) < 0) {
      // removed
      result['_' + index] = [array1[index], 0, 0];
      removedItems.push(index);
    }
  }

  var detectMove = true;
  if (context.options && context.options.arrays && context.options.arrays.detectMove === false) {
    detectMove = false;
  }
  var includeValueOnMove = false;
  if (context.options && context.options.arrays && context.options.arrays.includeValueOnMove) {
    includeValueOnMove = true;
  }

  var removedItemsLength = removedItems.length;
  for (index = commonHead; index < len2 - commonTail; index++) {
    var indexOnArray2 = arrayIndexOf(seq.indices2, index - commonHead);
    if (indexOnArray2 < 0) {
      // added, try to match with a removed item and register as position move
      var isMove = false;
      if (detectMove && removedItemsLength > 0) {
        for (var removeItemIndex1 = 0; removeItemIndex1 < removedItemsLength; removeItemIndex1++) {
          index1 = removedItems[removeItemIndex1];
          if (matchItems(trimmed1, trimmed2, index1 - commonHead,
            index - commonHead, matchContext)) {
            // store position move as: [originalValue, newPosition, ARRAY_MOVE]
            result['_' + index1].splice(1, 2, index, ARRAY_MOVE);
            if (!includeValueOnMove) {
              // don't include moved value on diff, to save bytes
              result['_' + index1][0] = '';
            }

            index2 = index;
            child = new DiffContext$3(context.left[index1], context.right[index2]);
            context.push(child, index2);
            removedItems.splice(removeItemIndex1, 1);
            isMove = true;
            break;
          }
        }
      }
      if (!isMove) {
        // added
        result[index] = [array2[index]];
      }
    } else {
      // match, do inner diff
      index1 = seq.indices1[indexOnArray2] + commonHead;
      index2 = seq.indices2[indexOnArray2] + commonHead;
      child = new DiffContext$3(context.left[index1], context.right[index2]);
      context.push(child, index2);
    }
  }

  context.setResult(result).exit();

};
diffFilter$1.filterName = 'arrays';

var compare = {
  numerically: function(a, b) {
    return a - b;
  },
  numericallyBy: function(name) {
    return function(a, b) {
      return a[name] - b[name];
    };
  }
};

var patchFilter$2 = function nestedPatchFilter(context) {
  if (!context.nested) {
    return;
  }
  if (context.delta._t !== 'a') {
    return;
  }
  var index, index1;

  var delta = context.delta;
  var array = context.left;

  // first, separate removals, insertions and modifications
  var toRemove = [];
  var toInsert = [];
  var toModify = [];
  for (index in delta) {
    if (index !== '_t') {
      if (index[0] === '_') {
        // removed item from original array
        if (delta[index][2] === 0 || delta[index][2] === ARRAY_MOVE) {
          toRemove.push(parseInt(index.slice(1), 10));
        } else {
          throw new Error('only removal or move can be applied at original array indices' +
            ', invalid diff type: ' + delta[index][2]);
        }
      } else {
        if (delta[index].length === 1) {
          // added item at new array
          toInsert.push({
            index: parseInt(index, 10),
            value: delta[index][0]
          });
        } else {
          // modified item at new array
          toModify.push({
            index: parseInt(index, 10),
            delta: delta[index]
          });
        }
      }
    }
  }

  // remove items, in reverse order to avoid sawing our own floor
  toRemove = toRemove.sort(compare.numerically);
  for (index = toRemove.length - 1; index >= 0; index--) {
    index1 = toRemove[index];
    var indexDiff = delta['_' + index1];
    var removedValue = array.splice(index1, 1)[0];
    if (indexDiff[2] === ARRAY_MOVE) {
      // reinsert later
      toInsert.push({
        index: indexDiff[1],
        value: removedValue
      });
    }
  }

  // insert items, in reverse order to avoid moving our own floor
  toInsert = toInsert.sort(compare.numericallyBy('index'));
  var toInsertLength = toInsert.length;
  for (index = 0; index < toInsertLength; index++) {
    var insertion = toInsert[index];
    array.splice(insertion.index, 0, insertion.value);
  }

  // apply modifications
  var toModifyLength = toModify.length;
  var child;
  if (toModifyLength > 0) {
    for (index = 0; index < toModifyLength; index++) {
      var modification = toModify[index];
      child = new PatchContext$3(context.left[modification.index], modification.delta);
      context.push(child, modification.index);
    }
  }

  if (!context.children) {
    context.setResult(context.left).exit();
    return;
  }
  context.exit();
};
patchFilter$2.filterName = 'arrays';

var collectChildrenPatchFilter$1 = function collectChildrenPatchFilter(context) {
  if (!context || !context.children) {
    return;
  }
  if (context.delta._t !== 'a') {
    return;
  }
  var length = context.children.length;
  var child;
  for (var index = 0; index < length; index++) {
    child = context.children[index];
    context.left[child.childName] = child.result;
  }
  context.setResult(context.left).exit();
};
collectChildrenPatchFilter$1.filterName = 'arraysCollectChildren';

var reverseFilter$2 = function arraysReverseFilter(context) {
  if (!context.nested) {
    if (context.delta[2] === ARRAY_MOVE) {
      context.newName = '_' + context.delta[1];
      context.setResult([context.delta[0], parseInt(context.childName.substr(1), 10), ARRAY_MOVE]).exit();
    }
    return;
  }
  if (context.delta._t !== 'a') {
    return;
  }
  var name, child;
  for (name in context.delta) {
    if (name === '_t') {
      continue;
    }
    child = new ReverseContext$3(context.delta[name]);
    context.push(child, name);
  }
  context.exit();
};
reverseFilter$2.filterName = 'arrays';

var reverseArrayDeltaIndex = function(delta, index, itemDelta) {
  if (typeof index === 'string' && index[0] === '_') {
    return parseInt(index.substr(1), 10);
  } else if (isArray$2(itemDelta) && itemDelta[2] === 0) {
    return '_' + index;
  }

  var reverseIndex = +index;
  for (var deltaIndex in delta) {
    var deltaItem = delta[deltaIndex];
    if (isArray$2(deltaItem)) {
      if (deltaItem[2] === ARRAY_MOVE) {
        var moveFromIndex = parseInt(deltaIndex.substr(1), 10);
        var moveToIndex = deltaItem[1];
        if (moveToIndex === +index) {
          return moveFromIndex;
        }
        if (moveFromIndex <= reverseIndex && moveToIndex > reverseIndex) {
          reverseIndex++;
        } else if (moveFromIndex >= reverseIndex && moveToIndex < reverseIndex) {
          reverseIndex--;
        }
      } else if (deltaItem[2] === 0) {
        var deleteIndex = parseInt(deltaIndex.substr(1), 10);
        if (deleteIndex <= reverseIndex) {
          reverseIndex++;
        }
      } else if (deltaItem.length === 1 && deltaIndex <= reverseIndex) {
        reverseIndex--;
      }
    }
  }

  return reverseIndex;
};

var collectChildrenReverseFilter$1 = function collectChildrenReverseFilter(context) {
  if (!context || !context.children) {
    return;
  }
  if (context.delta._t !== 'a') {
    return;
  }
  var length = context.children.length;
  var child;
  var delta = {
    _t: 'a'
  };

  for (var index = 0; index < length; index++) {
    child = context.children[index];
    var name = child.newName;
    if (typeof name === 'undefined') {
      name = reverseArrayDeltaIndex(context.delta, child.childName, child.result);
    }
    if (delta[name] !== child.result) {
      delta[name] = child.result;
    }
  }
  context.setResult(delta).exit();
};
collectChildrenReverseFilter$1.filterName = 'arraysCollectChildren';

var diffFilter_1$1 = diffFilter$1;
var patchFilter_1$2 = patchFilter$2;
var collectChildrenPatchFilter_1$1 = collectChildrenPatchFilter$1;
var reverseFilter_1$2 = reverseFilter$2;
var collectChildrenReverseFilter_1$1 = collectChildrenReverseFilter$1;

var arrays = {
	diffFilter: diffFilter_1$1,
	patchFilter: patchFilter_1$2,
	collectChildrenPatchFilter: collectChildrenPatchFilter_1$1,
	reverseFilter: reverseFilter_1$2,
	collectChildrenReverseFilter: collectChildrenReverseFilter_1$1
};

var diffFilter$2 = function datesDiffFilter(context) {
  if (context.left instanceof Date) {
    if (context.right instanceof Date) {
      if (context.left.getTime() !== context.right.getTime()) {
        context.setResult([context.left, context.right]);
      } else {
        context.setResult(undefined);
      }
    } else {
      context.setResult([context.left, context.right]);
    }
    context.exit();
  } else if (context.right instanceof Date) {
    context.setResult([context.left, context.right]).exit();
  }
};
diffFilter$2.filterName = 'dates';

var diffFilter_1$2 = diffFilter$2;

var dates = {
	diffFilter: diffFilter_1$2
};

/* global diff_match_patch */
var TEXT_DIFF = 2;
var DEFAULT_MIN_LENGTH = 60;
var cachedDiffPatch = null;

var getDiffMatchPatch = function(required) {
  /*jshint camelcase: false */

  if (!cachedDiffPatch) {
    var instance;
    if (typeof diff_match_patch !== 'undefined') {
      // already loaded, probably a browser
      instance = typeof diff_match_patch === 'function' ?
        new diff_match_patch() : new diff_match_patch.diff_match_patch();
    } else if (typeof commonjsRequire === 'function') {
      try {
        var dmpModuleName = 'diff_match_patch_uncompressed';
        var dmp = commonjsRequire('../../public/external/' + dmpModuleName);
        instance = new dmp.diff_match_patch();
      } catch (err) {
        instance = null;
      }
    }
    if (!instance) {
      if (!required) {
        return null;
      }
      var error = new Error('text diff_match_patch library not found');
      error.diff_match_patch_not_found = true;
      throw error;
    }
    cachedDiffPatch = {
      diff: function(txt1, txt2) {
        return instance.patch_toText(instance.patch_make(txt1, txt2));
      },
      patch: function(txt1, patch) {
        var results = instance.patch_apply(instance.patch_fromText(patch), txt1);
        for (var i = 0; i < results[1].length; i++) {
          if (!results[1][i]) {
            var error = new Error('text patch failed');
            error.textPatchFailed = true;
          }
        }
        return results[0];
      }
    };
  }
  return cachedDiffPatch;
};

var diffFilter$3 = function textsDiffFilter(context) {
  if (context.leftType !== 'string') {
    return;
  }
  var minLength = (context.options && context.options.textDiff &&
    context.options.textDiff.minLength) || DEFAULT_MIN_LENGTH;
  if (context.left.length < minLength ||
    context.right.length < minLength) {
    context.setResult([context.left, context.right]).exit();
    return;
  }
  // large text, try to use a text-diff algorithm
  var diffMatchPatch = getDiffMatchPatch();
  if (!diffMatchPatch) {
    // diff-match-patch library not available, fallback to regular string replace
    context.setResult([context.left, context.right]).exit();
    return;
  }
  var diff = diffMatchPatch.diff;
  context.setResult([diff(context.left, context.right), 0, TEXT_DIFF]).exit();
};
diffFilter$3.filterName = 'texts';

var patchFilter$3 = function textsPatchFilter(context) {
  if (context.nested) {
    return;
  }
  if (context.delta[2] !== TEXT_DIFF) {
    return;
  }

  // text-diff, use a text-patch algorithm
  var patch = getDiffMatchPatch(true).patch;
  context.setResult(patch(context.left, context.delta[0])).exit();
};
patchFilter$3.filterName = 'texts';

var textDeltaReverse = function(delta) {
  var i, l, lines, line, lineTmp, header = null,
    headerRegex = /^@@ +\-(\d+),(\d+) +\+(\d+),(\d+) +@@$/,
    lineHeader, lineAdd, lineRemove;
  lines = delta.split('\n');
  for (i = 0, l = lines.length; i < l; i++) {
    line = lines[i];
    var lineStart = line.slice(0, 1);
    if (lineStart === '@') {
      header = headerRegex.exec(line);
      lineHeader = i;
      lineAdd = null;
      lineRemove = null;

      // fix header
      lines[lineHeader] = '@@ -' + header[3] + ',' + header[4] + ' +' + header[1] + ',' + header[2] + ' @@';
    } else if (lineStart === '+') {
      lineAdd = i;
      lines[i] = '-' + lines[i].slice(1);
      if (lines[i - 1].slice(0, 1) === '+') {
        // swap lines to keep default order (-+)
        lineTmp = lines[i];
        lines[i] = lines[i - 1];
        lines[i - 1] = lineTmp;
      }
    } else if (lineStart === '-') {
      lineRemove = i;
      lines[i] = '+' + lines[i].slice(1);
    }
  }
  return lines.join('\n');
};

var reverseFilter$3 = function textsReverseFilter(context) {
  if (context.nested) {
    return;
  }
  if (context.delta[2] !== TEXT_DIFF) {
    return;
  }

  // text-diff, use a text-diff algorithm
  context.setResult([textDeltaReverse(context.delta[0]), 0, TEXT_DIFF]).exit();
};
reverseFilter$3.filterName = 'texts';

var diffFilter_1$3 = diffFilter$3;
var patchFilter_1$3 = patchFilter$3;
var reverseFilter_1$3 = reverseFilter$3;

var texts = {
	diffFilter: diffFilter_1$3,
	patchFilter: patchFilter_1$3,
	reverseFilter: reverseFilter_1$3
};

var Processor = processor.Processor;
var Pipe = pipe.Pipe;
var DiffContext = diff.DiffContext;
var PatchContext = patch.PatchContext;
var ReverseContext = reverse.ReverseContext;









var DiffPatcher = function DiffPatcher(options) {
  this.processor = new Processor(options);
  this.processor.pipe(new Pipe('diff').append(
    nested.collectChildrenDiffFilter,
    trivial.diffFilter,
    dates.diffFilter,
    texts.diffFilter,
    nested.objectsDiffFilter,
    arrays.diffFilter
  ).shouldHaveResult());
  this.processor.pipe(new Pipe('patch').append(
    nested.collectChildrenPatchFilter,
    arrays.collectChildrenPatchFilter,
    trivial.patchFilter,
    texts.patchFilter,
    nested.patchFilter,
    arrays.patchFilter
  ).shouldHaveResult());
  this.processor.pipe(new Pipe('reverse').append(
    nested.collectChildrenReverseFilter,
    arrays.collectChildrenReverseFilter,
    trivial.reverseFilter,
    texts.reverseFilter,
    nested.reverseFilter,
    arrays.reverseFilter
  ).shouldHaveResult());
};

DiffPatcher.prototype.options = function() {
  return this.processor.options.apply(this.processor, arguments);
};

DiffPatcher.prototype.diff = function(left, right) {
  return this.processor.process(new DiffContext(left, right));
};

DiffPatcher.prototype.patch = function(left, delta) {
  return this.processor.process(new PatchContext(left, delta));
};

DiffPatcher.prototype.reverse = function(delta) {
  return this.processor.process(new ReverseContext(delta));
};

DiffPatcher.prototype.unpatch = function(right, delta) {
  return this.patch(right, this.reverse(delta));
};

DiffPatcher.prototype.clone = function(value) {
  return clone_1(value);
};

var DiffPatcher_1 = DiffPatcher;

var diffpatcher = {
	DiffPatcher: DiffPatcher_1
};

// use as 2nd parameter for JSON.parse to revive Date instances
var dateReviver = function dateReviver(key, value) {
  var parts;
  if (typeof value === 'string') {
    parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d*))?(Z|([+\-])(\d{2}):(\d{2}))$/.exec(value);
    if (parts) {
      return new Date(Date.UTC(+parts[1], +parts[2] - 1, +parts[3], +parts[4], +parts[5], +parts[6], +(parts[7] || 0)));
    }
  }
  return value;
};

var main = createCommonjsModule(function (module, exports) {
var DiffPatcher = diffpatcher.DiffPatcher;
exports.DiffPatcher = DiffPatcher;

exports.create = function(options){
  return new DiffPatcher(options);
};

exports.dateReviver = dateReviver;

var defaultInstance;

exports.diff = function() {
  if (!defaultInstance) {
    defaultInstance = new DiffPatcher();
  }
  return defaultInstance.diff.apply(defaultInstance, arguments);
};

exports.patch = function() {
  if (!defaultInstance) {
    defaultInstance = new DiffPatcher();
  }
  return defaultInstance.patch.apply(defaultInstance, arguments);
};

exports.unpatch = function() {
  if (!defaultInstance) {
    defaultInstance = new DiffPatcher();
  }
  return defaultInstance.unpatch.apply(defaultInstance, arguments);
};

exports.reverse = function() {
  if (!defaultInstance) {
    defaultInstance = new DiffPatcher();
  }
  return defaultInstance.reverse.apply(defaultInstance, arguments);
};

exports.clone = function() {
  if (!defaultInstance) {
    defaultInstance = new DiffPatcher();
  }
  return defaultInstance.clone.apply(defaultInstance, arguments);
};


if (environment.isBrowser) {
  exports.homepage = '{{package-homepage}}';
  exports.version = '{{package-version}}';
} else {
  var packageInfoModuleName = '../package.json';
  var packageInfo = commonjsRequire(packageInfoModuleName);
  exports.homepage = packageInfo.homepage;
  exports.version = packageInfo.version;

  var formatterModuleName = './formatters';
  var formatters = commonjsRequire(formatterModuleName);
  exports.formatters = formatters;
  // shortcut for console
  exports.console = formatters.console;
}
});

var isArray$3 = (typeof Array.isArray === 'function') ?
  // use native function
  Array.isArray :
  // use instanceof operator
  function(a) {
    return a instanceof Array;
  };

var getObjectKeys = typeof Object.keys === 'function' ?
  function(obj) {
    return Object.keys(obj);
  } : function(obj) {
    var names = [];
    for (var property in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, property)) {
        names.push(property);
      }
    }
    return names;
  };

var trimUnderscore = function(str) {
  if (str.substr(0, 1) === '_') {
    return str.slice(1);
  }
  return str;
};

var arrayKeyToSortNumber = function(key) {
  if (key === '_t') {
    return -1;
  } else {
    if (key.substr(0, 1) === '_') {
      return parseInt(key.slice(1), 10);
    } else {
      return parseInt(key, 10) + 0.1;
    }
  }
};

var arrayKeyComparer = function(key1, key2) {
  return arrayKeyToSortNumber(key1) - arrayKeyToSortNumber(key2);
};

var BaseFormatter$1 = function BaseFormatter() {};

BaseFormatter$1.prototype.format = function(delta, left) {
  var context = {};
  this.prepareContext(context);
  this.recurse(context, delta, left);
  return this.finalize(context);
};

BaseFormatter$1.prototype.prepareContext = function(context) {
  context.buffer = [];
  context.out = function() {
    this.buffer.push.apply(this.buffer, arguments);
  };
};

BaseFormatter$1.prototype.typeFormattterNotFound = function(context, deltaType) {
  throw new Error('cannot format delta type: ' + deltaType);
};

BaseFormatter$1.prototype.typeFormattterErrorFormatter = function(context, err) {
  return err.toString();
};

BaseFormatter$1.prototype.finalize = function(context) {
  if (isArray$3(context.buffer)) {
    return context.buffer.join('');
  }
};

BaseFormatter$1.prototype.recurse = function(context, delta, left, key, leftKey, movedFrom, isLast) {

  var useMoveOriginHere = delta && movedFrom;
  var leftValue = useMoveOriginHere ? movedFrom.value : left;

  if (typeof delta === 'undefined' && typeof key === 'undefined') {
    return undefined;
  }

  var type = this.getDeltaType(delta, movedFrom);
  var nodeType = type === 'node' ? (delta._t === 'a' ? 'array' : 'object') : '';

  if (typeof key !== 'undefined') {
    this.nodeBegin(context, key, leftKey, type, nodeType, isLast);
  } else {
    this.rootBegin(context, type, nodeType);
  }

  var typeFormattter;
  try {
    typeFormattter = this['format_' + type] || this.typeFormattterNotFound(context, type);
    typeFormattter.call(this, context, delta, leftValue, key, leftKey, movedFrom);
  } catch (err) {
    this.typeFormattterErrorFormatter(context, err, delta, leftValue, key, leftKey, movedFrom);
    if (typeof console !== 'undefined' && console.error) {
      console.error(err.stack);
    }
  }

  if (typeof key !== 'undefined') {
    this.nodeEnd(context, key, leftKey, type, nodeType, isLast);
  } else {
    this.rootEnd(context, type, nodeType);
  }
};

BaseFormatter$1.prototype.formatDeltaChildren = function(context, delta, left) {
  var self = this;
  this.forEachDeltaKey(delta, left, function(key, leftKey, movedFrom, isLast) {
    self.recurse(context, delta[key], left ? left[leftKey] : undefined,
      key, leftKey, movedFrom, isLast);
  });
};

BaseFormatter$1.prototype.forEachDeltaKey = function(delta, left, fn) {
  var keys = getObjectKeys(delta);
  var arrayKeys = delta._t === 'a';
  var moveDestinations = {};
  var name;
  if (typeof left !== 'undefined') {
    for (name in left) {
      if (Object.prototype.hasOwnProperty.call(left, name)) {
        if (typeof delta[name] === 'undefined' &&
          ((!arrayKeys) || typeof delta['_' + name] === 'undefined')) {
          keys.push(name);
        }
      }
    }
  }
  // look for move destinations
  for (name in delta) {
    if (Object.prototype.hasOwnProperty.call(delta, name)) {
      var value = delta[name];
      if (isArray$3(value) && value[2] === 3) {
        moveDestinations[value[1].toString()] = {
          key: name,
          value: left && left[parseInt(name.substr(1))]
        };
        if (this.includeMoveDestinations !== false) {
          if ((typeof left === 'undefined') &&
            (typeof delta[value[1]] === 'undefined')) {
            keys.push(value[1].toString());
          }
        }
      }
    }
  }
  if (arrayKeys) {
    keys.sort(arrayKeyComparer);
  } else {
    keys.sort();
  }
  for (var index = 0, length = keys.length; index < length; index++) {
    var key = keys[index];
    if (arrayKeys && key === '_t') {
      continue;
    }
    var leftKey = arrayKeys ?
      (typeof key === 'number' ? key : parseInt(trimUnderscore(key), 10)) :
      key;
    var isLast = (index === length - 1);
    fn(key, leftKey, moveDestinations[leftKey], isLast);
  }
};

BaseFormatter$1.prototype.getDeltaType = function(delta, movedFrom) {
  if (typeof delta === 'undefined') {
    if (typeof movedFrom !== 'undefined') {
      return 'movedestination';
    }
    return 'unchanged';
  }
  if (isArray$3(delta)) {
    if (delta.length === 1) {
      return 'added';
    }
    if (delta.length === 2) {
      return 'modified';
    }
    if (delta.length === 3 && delta[2] === 0) {
      return 'deleted';
    }
    if (delta.length === 3 && delta[2] === 2) {
      return 'textdiff';
    }
    if (delta.length === 3 && delta[2] === 3) {
      return 'moved';
    }
  } else if (typeof delta === 'object') {
    return 'node';
  }
  return 'unknown';
};

BaseFormatter$1.prototype.parseTextDiff = function(value) {
  var output = [];
  var lines = value.split('\n@@ ');
  for (var i = 0, l = lines.length; i < l; i++) {
    var line = lines[i];
    var lineOutput = {
      pieces: []
    };
    var location = /^(?:@@ )?[-+]?(\d+),(\d+)/.exec(line).slice(1);
    lineOutput.location = {
      line: location[0],
      chr: location[1]
    };
    var pieces = line.split('\n').slice(1);
    for (var pieceIndex = 0, piecesLength = pieces.length; pieceIndex < piecesLength; pieceIndex++) {
      var piece = pieces[pieceIndex];
      if (!piece.length) {
        continue;
      }
      var pieceOutput = {
        type: 'context'
      };
      if (piece.substr(0, 1) === '+') {
        pieceOutput.type = 'added';
      } else if (piece.substr(0, 1) === '-') {
        pieceOutput.type = 'deleted';
      }
      pieceOutput.text = piece.slice(1);
      lineOutput.pieces.push(pieceOutput);
    }
    output.push(lineOutput);
  }
  return output;
};

var BaseFormatter_1 = BaseFormatter$1;

var base = {
	BaseFormatter: BaseFormatter_1
};

var BaseFormatter = base.BaseFormatter;

var colors = {
  added: 'color:green',
  deleted: 'color:red',
  movedestination: 'color:gray',
  moved: 'color:blue',
  unchanged: 'hide',
  error: 'background:red',
  textDiffLine: 'color:gray'
};

function ConsoleFormatter () {
  this.includeMoveDestinations = false;
}

ConsoleFormatter.prototype = new BaseFormatter();

ConsoleFormatter.prototype.finalize = function (context) {
  var match = context.styles.length === 0;
  var styles = context.styles;
  var buffer = context.buffer
               .join('')
               .split('\n');
  buffer = buffer
               .filter((t, i) => !(t.match(/^ +$/) && buffer[i] === t));

  var styleCounter = 0;
  for (var i = 0; i < buffer.length; i++) {
    var b = buffer[i];
    var styleOccurences = b.split('%c').length - 1;
    if (styleOccurences === 0) {
      buffer[i] = '%c' + b;
      styles.splice(styleCounter, 0, '');
      styleCounter++;
    } else {
      styleCounter += styleOccurences;
    }
  }

  var text = buffer.join('\n');
  return {
    logArguments: [text].concat(styles),
    match: match
  }
};

ConsoleFormatter.prototype.prepareContext = function (context) {
  BaseFormatter.prototype.prepareContext.call(this, context);
  context.styles = context.styles || [];
  context.indent = function (levels) {
    this.indentLevel = (this.indentLevel || 0) +
      (typeof levels === 'undefined' ? 1 : levels);
    this.indentPad = new Array(this.indentLevel + 1).join('  ');
    this.outLine();
  };
  context.outLine = function () {
    this.buffer.push('\n' + (this.indentPad || ''));
  };
  context.out = function () {
    for (var i = 0, l = arguments.length; i < l; i++) {
      var lines = arguments[i].split('\n');
      var text = lines.join('\n' + (this.indentPad || ''));
      if (this.color == null || this.color[0] !== 'hide') {
        if (this.color && this.color[0]) {
          text = '%c' + text;
          this.styles.push(this.color[0]);
        }
        this.buffer.push(text);
      }
    }
  };
  context.pushColor = function (color) {
    this.color = this.color || [];
    this.color.unshift(color);
  };
  context.popColor = function () {
    this.color = this.color || [];
    this.color.shift();
  };
};

ConsoleFormatter.prototype.typeFormattterErrorFormatter = function (context, err) {
  context.pushColor(colors.error);
  context.out('[ERROR]' + err);
  context.popColor();
};

ConsoleFormatter.prototype.formatValue = function (context, value) {
  context.out(JSON.stringify(value, null, 2));
};

ConsoleFormatter.prototype.formatTextDiffString = function (context, value) {
  var lines = this.parseTextDiff(value);
  context.indent();
  for (var i = 0, l = lines.length; i < l; i++) {
    var line = lines[i];
    context.pushColor(colors.textDiffLine);
    context.out(line.location.line + ',' + line.location.chr + ' ');
    context.popColor();
    var pieces = line.pieces;
    for (var pieceIndex = 0, piecesLength = pieces.length; pieceIndex < piecesLength; pieceIndex++) {
      var piece = pieces[pieceIndex];
      context.pushColor(colors[piece.type]);
      context.out(piece.text);
      context.popColor();
    }
    if (i < l - 1) {
      context.outLine();
    }
  }
  context.indent(-1);
};

ConsoleFormatter.prototype.rootBegin = function (context, type, nodeType) {
  context.pushColor(colors[type]);
  if (type === 'node') {
    context.out(nodeType === 'array' ? '[' : '{');
    context.indent();
  }
};

ConsoleFormatter.prototype.rootEnd = function (context, type, nodeType) {
  if (type === 'node') {
    context.indent(-1);
    context.out(nodeType === 'array' ? ']' : '}');
  }
  context.popColor();
};

ConsoleFormatter.prototype.nodeBegin = function (context, key, leftKey, type, nodeType) {
  context.pushColor(colors[type]);
  context.out(leftKey + ': ');
  if (type === 'node') {
    context.out(nodeType === 'array' ? '[' : '{');
    context.indent();
  }
};

ConsoleFormatter.prototype.nodeEnd = function (context, key, leftKey, type, nodeType, isLast) {
  if (type === 'node') {
    context.indent(-1);
    context.out(nodeType === 'array' ? ']' : '}' +
      (isLast ? '' : ','));
  }
  if (!isLast) {
    context.outLine();
  }
  context.popColor();
};

/* jshint camelcase: false */

ConsoleFormatter.prototype.format_unchanged = function (context, delta, left) {
  if (typeof left === 'undefined') {
    return
  }
  this.formatValue(context, left);
};

ConsoleFormatter.prototype.format_movedestination = function (context, delta, left) {
  if (typeof left === 'undefined') {
    return
  }
  this.formatValue(context, left);
};

ConsoleFormatter.prototype.format_node = function (context, delta, left) {
  // recurse
  this.formatDeltaChildren(context, delta, left);
};

ConsoleFormatter.prototype.format_added = function (context, delta) {
  this.formatValue(context, delta[0]);
};

ConsoleFormatter.prototype.format_modified = function (context, delta) {
  context.pushColor(colors.deleted);
  this.formatValue(context, delta[0]);
  context.popColor();
  context.out(' => ');
  context.pushColor(colors.added);
  this.formatValue(context, delta[1]);
  context.popColor();
};

ConsoleFormatter.prototype.format_deleted = function (context, delta) {
  this.formatValue(context, delta[0]);
};

ConsoleFormatter.prototype.format_moved = function (context, delta) {
  context.out('==> ' + delta[1]);
};

ConsoleFormatter.prototype.format_textdiff = function (context, delta) {
  this.formatTextDiffString(context, delta[0]);
};

var defaultInstance;

function format (delta, left) {
  if (!defaultInstance) {
    defaultInstance = new ConsoleFormatter();
  }
  return defaultInstance.format(delta, left)
}

class Logger {
  constructor () {
    this.buffer = [];
    this.failed = false;
    this.errors = 0;
  }
  fail () {
    this.failed = true;
    this.errors++;
  }
  log () {
    this.buffer.push({
      f: 'log',
      args: Array.prototype.slice.call(arguments)
    });
  }
  error () {
    this.fail();
    var args = Array.prototype.slice.call(arguments);
    if (typeof args[0] === 'string') {
      args[0] = '%c' + args[0];
      args.splice(1, 0, 'color:red');
    }
    args.push(new Error().stack);
    this.buffer.push({
      f: 'log',
      args: args
    });
  }
  assert (condition, output) {
    if (!condition) {
      this.fail();
    }
    this.buffer.push({
      f: 'log',
      args: [`%c${output}`, `color: ${condition ? 'green' : 'red'}`]
    });
  }
  group (f, ...args) {
    if (args.length === 0 || typeof args[0] !== 'string') {
      args.unshift('Group');
    }
    args[0] = '%c' + args[0];
    this.buffer.push({
      f: 'groupCollapsed',
      args: args
    });
    var eBeforeExecution = this.errors;
    try {
      f();
    } catch (e) {
      this.fail();
      this.buffer.push({
        f: 'log',
        args: ['%cUncaught ' + e.stack, 'color:red']
      });
    }
    if (eBeforeExecution === this.errors) {
      args.splice(1, 0, '');
    } else {
      args.splice(1, 0, 'color: red');
    }
    this.buffer.push({
      f: 'groupEnd'
    });
  }
  async asyncGroup (f, ...args) {
    if (args.length === 0 || typeof args[0] !== 'string') {
      args.unshift('Group');
    }
    args[0] = '%c' + args[0];
    this.buffer.push({
      f: 'groupCollapsed',
      args: args
    });
    var eBeforeExecution = this.errors;
    try {
      await f();
    } catch (e) {
      this.fail();
      this.buffer.push({
        f: 'log',
        args: ['%cUncaught ' + e.stack, 'color:red']
      });
    }
    if (eBeforeExecution === this.errors) {
      args.splice(1, 0, '');
    } else {
      args.splice(1, 0, 'color: red');
    }
    this.buffer.push({
      f: 'groupEnd'
    });
  }
  compare (o1, o2, name) {
    var arg1 = typeof o1 === 'string' ? `"${o1}"` : cloneDeep(o1);
    var arg2 = typeof o2 === 'string' ? `"${o2}"` : cloneDeep(o2);
    this.group(() => {
      var delta = main.diff(o1, o2);
      var res = format(delta, o1);
      if (!res.match) {
        this.fail();
      }
      this.log.apply(this, res.logArguments);
    }, name, arg1, arg2);
  }
}

class TestCase extends Logger {
  constructor (testDescription, testFunction, location, valueGenerators, opts) {
    super();
    this.valueGenerators = valueGenerators;
    this.description = testDescription;
    this.testFunction = testFunction;
    this.location = location;
    this.name = testFunction.name;
    this._seed = null;
    this.status = 'pending';
    this.opts = opts || {};
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
    this.status = 'running';
    var __iterateOverGenerators = async (gens, args, argcase) => {
      if (gens.length === 0) {
        argcase.i++;
        if (testHandler.opts.case == null || testHandler.opts.case === argcase.i) {
          var url = createTestLink({
            test: this.name,
            seed: this._seed,
            case: argcase.i,
            repeat: this.isRepeating()
          });
          args.push(url);
          await this.asyncGroup(async () => {
            await this.testFunction(this, ...args);
          }, 'Arguments:', ...args);
        }
      } else {
        var gen = gens.shift();
        for (var arg of gen) {
          await __iterateOverGenerators(gens.slice(), args.slice().concat([arg]), argcase);
        }
      }
    };
    var __testStarter = () => {
      var test;
      if (this.valueGenerators.length > 0) {
        test = __iterateOverGenerators(this.valueGenerators, [], { i: 0 });
      } else {
        test = this.testFunction(this);
      }
      test.then(async () => {
        this.status = 'done';
        await this.print();
        testHandler.testCompleted(this);
      }, async (err) => {
        this.status = 'done';
        this.failed = true;
        this.buffer.push({
          f: 'log',
          args: ['%cUncaught ' + err.stack, 'color: red']
        });
        await this.print();
        testHandler.testCompleted(this);
      });
    };
    setTimeout(__testStarter, 0);
  }
  getSeed () {
    if (this._seed == null) {
      this._seed = testHandler.getRandomSeed() || Math.random();
    }
    return this._seed
  }
  print () {
    if (browserSupport) {
      var url = createTestLink({
        test: this.name,
        seed: this._seed,
        repeat: false
      });
      console.groupCollapsed(
        `%c${testHandler.numberOfCompletedTests}/${testHandler.numberOfTests}%c ${this.failed ? 'X' : '√'} ${this.description}`,
        'font-weight: bold',
        `color: ${this.failed ? 'red' : 'green'}`
      );
      console.log(`%cLocation: ${this.location.fileName}:${this.location.lineNumber}\nRun test again: ${url}`, 'color: grey; font-style: italic; font-size: x-small');
      this.buffer.forEach(function (b) {
        console[b.f].apply(console, b.args);
      });
      console.groupEnd();
    } else {
      console.log(
        `${testHandler.numberOfCompletedTests}/${testHandler.numberOfTests} ${this.failed ? 'X' : '√'} ${this.description}`
      );
    }
  }
}

function proxyConsole () {
  function createProxy (fName) {
    var originallog = console[fName];
    console[fName] = function consoleProxy () {
      var trace = new Error().stack.split('\n');
      var i = trace.length - 1;
      while (i > 0 && trace[i].match((/^ {4}at (?:<anonymous>|__iterateOverGenerators|__testStarter|TestCase.*\.asyncGroup|asyncGroup).*/))) {
        i--;
      }
      var hasTestName = trace[i]
        .match(/^ {4}at TestCase.*\.(\S+) .*/);
      if (hasTestName !== null && hasTestName[1] !== 'print') {
        var testcase = testHandler.tests[hasTestName[1]];
        testcase[fName].apply(testcase, arguments);
      } else {
        originallog.apply(console, arguments);
      }
    };
  }
  ['log', 'error', 'assert'].map(createProxy);
}

index.stacktrace = stacktrace;

function test (testDescription, ...args) {
  let location = stacktrace.getSync()[1];
  var testFunction = args.pop();
  var testCase = new TestCase(testDescription, testFunction, location, args, { parallel: true });
  testHandler.register(testCase);
}

function sequentialTest (testDescription, ...args) {
  var location = stacktrace.getSync()[1];
  var testFunction = args.pop();
  var testCase = new TestCase(testDescription, testFunction, location, args);
  testHandler.register(testCase);
}

exports.test = test;
exports.sequentialTest = sequentialTest;
exports.proxyConsole = proxyConsole;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cutest.js.map
