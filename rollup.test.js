import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import multiEntry from 'rollup-plugin-multi-entry'

export default {
  entry: 'tests/**/*.js',
  moduleName: 'tests',
  format: 'umd',
  plugins: [
    nodeResolve({
      jsnext: true,
      browser: true
    }),
    commonjs(),
    multiEntry()
  ],
  dest: 'test.js',
  sourceMap: true
}
