import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  entry: 'tests/basic.js',
  moduleName: 'tests',
  format: 'umd',
  plugins: [
    nodeResolve({
      main: true,
      jsnext: true,
      browser: true
    }),
    commonjs()
  ],
  dest: 'test.js',
  sourceMap: true
}
