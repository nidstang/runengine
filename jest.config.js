const path = require('path');
const process = require('process');

const getProdPath = () => path.resolve(__dirname, 'dist', 'runengine.umd.js');
const getDevPath = () => path.resolve(__dirname, 'src', 'index.js');

module.exports = {
    moduleFileExtensions: ['js', 'json', 'jsx'],
    verbose: false,

    testMatch: [
        "<rootDir>/tests/*"
    ],

    transform: {
      testEnvironment: "jsdom",
       "^.+\\.js$": "babel-jest",
    },

    moduleNameMapper: {
        "@source$": process.env.NODE_ENV === 'prod' ? getProdPath() : getDevPath(),
    },
};
