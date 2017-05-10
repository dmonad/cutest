# t--
> Awesome tests. Executes tests asynchronously (all at once)

No reporter, no set-up, no global variables. Just run the test file in any environment and **t--** will log to the console. That's it.

```js
import test from 't--'

test('Comparing 1 and 1', async function test1 (t) {
  t.assert(Number('1') === 1, '"1" equals 1')
})

test('This one is gonna fail', async function test3 (t) {
  t.assert(Number('One') === 1, 'One equals 1')
  t.log('Assertions don\'t break the computation')
  throw new Error('Only Exceptions breaks the computation!')
})

test('Compare Json', async function test2 (t) {
  t.compare({ a: 1 }, { a: 1 }, 'Compare two Json objects')
  t.compare({ a: 1 }, { a: 2 }, 'Compare two Json objects')
  t.compare({ a: 1 }, { a: 1, b: 4 }, 'Compare two Json objects')
  t.compare('t-- rocks', 'rocks!', 'Compare two Strings')
  t.compare([1, 2, 3], [1, 2], 'Compare Arrays')
})
```

![Demo](https://cloud.githubusercontent.com/assets/5553757/25725583/e986198c-3120-11e7-9a54-d48139475c07.png)

### Secret NodeJs moves

**Execute Script Once**

```
node test.js
```

**Live Reload** with [nodemon](https://github.com/remy/nodemon)

```
nodemon test.js
```

**Chrome DevTools Debugging** with [nodemon](https://github.com/remy/nodemon)

You already know this one:
```
node --inspect --debug-brk test.js
```

Now go to `chrome://inspect/#devices` and click on
"Open dedicated DevTools for Node". You didn't know about this one, didn't you?
Now you don't have to copy-paste the DevTools link anymore. It is automatically attached to the chrome browser.

Now combine this with nodemon:

```
nodemon --inspect --debug-brk test.js
```

Best node debugging ever!


### Browser Ninja Tricks

Just include the test script in your HTML file. If you don't have one, we got a nice live-reload server for you:

```
t-- test.js --open
```

It's not [Karma](https://karma-runner.github.io/1.0/index.html). But hey, it's
not [Karma](https://karma-runner.github.io/1.0/index.html)!! (If you know what I mean..)

# License
MIT © Kevin Jahns
