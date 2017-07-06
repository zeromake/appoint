import rollupTypescript from 'rollup-plugin-typescript'
import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'

const isProduction = process.env.NODE_ENV === 'production'
export default {
    entry: 'src/appoint.ts',
    format: 'umd',
    moduleName: 'Appoint',
    dest: 'dist/appoint.js',
    plugins: isProduction ? [
        uglify({}, minify),
        rollupTypescript()
    ]: [rollupTypescript()],
    sourceMap: !isProduction
}