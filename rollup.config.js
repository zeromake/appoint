const rollupTypescript = require('rollup-plugin-typescript')
const uglify = require('rollup-plugin-uglify')
import { minify } from 'uglify-es'

export default {
    entry: 'src/appoint.ts',
    format: 'umd',
    moduleName: 'Appoint',
    dest: 'dist/appoint.js',
    plugins: [
        uglify({}, minify),
        rollupTypescript()
    ],
    sourceMap: false
}