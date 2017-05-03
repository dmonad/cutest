import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'

var pkg = require('./package.json')

export default {
  entry: 'tests/basic.js',
  moduleName: 'tests',
  format: 'umd',
  plugins: [
    nodeResolve({
      main: true,
      jsnext: true,
      preferBuiltins: false,
      browser: true
    }),
    commonjs(),
    globals(),
    builtins()
  ],
  dest: 'test.js',
  sourceMap: true
};
