import babel from 'rollup-plugin-babel'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'

var pkg = require('./package.json')

const babelConfig = {
  exclude: 'node_modules/**',
  presets: [
    ['latest', {
      'es2015': {
        'modules': false
      }
    }]
  ],
  plugins: [
    'external-helpers',
    'transform-regenerator',
    ['transform-runtime', {
      'helpers': false,
      'polyfill': false,
      'regenerator': true
    }]
  ]
}

export default {
  entry: 'src/t--.js',
  moduleName: 't--',
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
    builtins(),
    babel(babelConfig)
  ],
  dest: 'y--.js',
  sourceMap: true,
  banner: `
/**
 * ${pkg.name} - ${pkg.description}
 * @version v${pkg.version}
 * @license ${pkg.license}
 */
`
}
