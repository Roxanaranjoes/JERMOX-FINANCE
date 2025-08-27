// middlewares/index.js
const { checkExists } = require('./checkExist');
const checkReferenceExists = require('./checkReferenceExists');

module.exports = { checkExists, checkReferenceExists };
