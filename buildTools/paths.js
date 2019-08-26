const path = require('path');
const fs = require('fs');

const appDirectory = fs.realpathSync(process.cwd());
module.exports.resolveApp = (...relativePath) => path.resolve(appDirectory, ...relativePath);
