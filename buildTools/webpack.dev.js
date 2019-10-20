const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const merge = require('webpack-merge');
const { resolveApp } = require('./paths');
const base = require('./webpack.base');

const distResolved = resolveApp('dist');

module.exports = merge(base, {
    mode: 'development',
    output: {
        path: distResolved,
        filename: 'bundle.js',
    },

    devServer: {
        contentBase: distResolved,
        historyApiFallback: true,
    },

    plugins: [
        new HtmlWebpackPlugin({
            title: 'idealista-tabs component',
            template: 'index.template.html',
        }),
    ],

    resolve: {
        alias: {
            '@source$': path.resolve(__dirname, 'src', 'index.js'),
        }
    },
});
