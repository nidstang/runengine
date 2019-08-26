const { resolveApp } = require('./paths');

module.exports = {
    entry: resolveApp('src', 'index.js'),
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ['babel-loader', 'eslint-loader'],
            },
        ],
    },
};
