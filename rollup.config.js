import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import multiEntry from 'rollup-plugin-multi-entry'
import json from 'rollup-plugin-json'
import inject from 'rollup-plugin-inject'

export default {
  entry: 'test/*',
  moduleName: 'cutest',
  format: 'umd',
  plugins: [
    json(),
    multiEntry(),
    nodeResolve({
      jsnext: true,
      browser: true
    }),
    commonjs(),
    inject({
      window: 'query-string'
    })
  ],
  dest: 'cutest.test.js',
  sourceMap: true
}
