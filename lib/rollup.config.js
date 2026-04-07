import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * (c) ${new Date().getFullYear()}
 * @license MIT
 */`;

export default [
  // UMD build for browsers
  {
    input: 'src/index.js',
    output: {
      file: pkg.browser,
      format: 'umd',
      name: 'Hollow',
      banner,
      sourcemap: true
    },
    plugins: [resolve()]
  },
  // Minified UMD build
  {
    input: 'src/index.js',
    output: {
      file: pkg.browser.replace('.js', '.min.js'),
      format: 'umd',
      name: 'Hollow',
      banner,
      sourcemap: true
    },
    plugins: [resolve(), terser()]
  },
  // ES module build
  {
    input: 'src/index.js',
    output: {
      file: pkg.module,
      format: 'es',
      banner,
      sourcemap: true
    },
    plugins: [resolve()]
  },
  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      file: pkg.main,
      format: 'cjs',
      banner,
      sourcemap: true,
      exports: 'auto'
    },
    plugins: [resolve()]
  }
];
