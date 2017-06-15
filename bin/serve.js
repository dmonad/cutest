#!/usr/bin/env node

const liveServer = require('live-server')
const meow = require('meow')

const cli = meow(`
Usage
  $ sprintest <test.js>

Options
  --open, -o  Open browser
  --port, -p  Port
Examples
  $ sprintest test.js
`, {
  alias: {
    o: 'open',
    p: 'port'
  }
})

const opt = {
  port: cli.flags.p || 9966,
  open: cli.flags.o || false,
  files: cli.input
}

if (opt.files.length === 0) {
  cli.showHelp()
}

let nextport = opt.port
for (let testfile of opt.files) {
  console.log(`Serving ${testfile} on http://localhost:${nextport}/`)
  let index = `
<!DOCTYPE HTML>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Debug ${testfile}</title>
</head>
<body>
    <h1>Debug ${testfile}</h1>
    <script src="${testfile}" type="text/javascript"></script>
</body>
</html>
`
  let serveIndexMiddleware = function (req, res, next) {
    console.log('path', req.url)
    var path = req.url.split('?')[0]
    if (req.url != null && (path.endsWith('.html') || path.endsWith('/'))) {
      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end(index)
    } else {
      next()
    }
  }

  let params = {
    port: nextport++,
    open: opt.open,
    file: testfile,
    logLevel: 0, // 0 = errors only, 1 = some, 2 = lots
    middleware: [serveIndexMiddleware]
  }
  liveServer.start(params)
}
