import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));

const production = !process.env.ROLLUP_WATCH;

export default [
  // UMD build (for browsers via script tag)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/agemin-sdk.umd.js',
      format: 'umd',
      name: 'Agemin',
      sourcemap: true,
    },
    plugins: [
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
        '__VERSION__': JSON.stringify(pkg.version)
      }),
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationDir: undefined
      })
    ]
  },
  // Minified UMD build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/agemin-sdk.min.js',
      format: 'umd',
      name: 'Agemin',
      sourcemap: true,
    },
    plugins: [
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production'),
        '__VERSION__': JSON.stringify(pkg.version)
      }),
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationDir: undefined
      }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ]
  },
  // ESM build (for modern bundlers)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/agemin-sdk.esm.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      replace({
        preventAssignment: true,
        '__VERSION__': JSON.stringify(pkg.version)
      }),
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
        rootDir: 'src'
      })
    ]
  },
  // CJS build (for Node.js)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/agemin-sdk.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      replace({
        preventAssignment: true,
        '__VERSION__': JSON.stringify(pkg.version)
      }),
      resolve({
        preferBuiltins: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationDir: undefined
      })
    ]
  }
];