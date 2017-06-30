const path = require('path')
const webpack = require('webpack')

const resolve = file => path.resolve(__dirname, file)
const isProd = process.env.NODE_ENV === 'production'

const config = {
    entry: {
        'appoint': resolve('src/index.js')
    },
    output: {
        path: resolve('dist'),
        filename: '[name].js',
        library: 'Appoint',
        libraryTarget: 'umd2'
    },
    devtool: '#source-map',
    resolve: {
        alias: {
            '@': resolve('src')
        },
        extensions: ['.ts']
    },
    plugins: [],
    module: {
        rules: [
             {
                test: /\.ts$/,
                use: 'tslint-loader',
                enforce: 'pre',
                exclude: /node_modules/
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: 'ts-loader'
            }
        ]
    }
}
if (isProd) {
    config.devtool = false
    config.plugins.push(
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    )
}
module.exports = config