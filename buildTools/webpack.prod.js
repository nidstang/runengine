const path = require('path');
const merge = require('webpack-merge');
const base = require('./webpack.base');

module.exports = merge(base, {
    mode: 'production',
    entry: path.resolve(__dirname, '..', 'src', 'index.js'),
    output: {
        path: path.resolve(__dirname, '..', 'dist'),
        filename: 'runengine.umd.js',
        library: 'runengine',
        libraryTarget: 'umd',
        umdNamedDefine: true,
    },

    optimization: {
        minimize: true,
    },
});
