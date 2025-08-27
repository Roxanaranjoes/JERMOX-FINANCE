// middlewares/index.js
const { checkExists } = require('./checkExists');
const checkReferenceExists = require('./checkReferenceExists');

module.exports = { checkExists, checkReferenceExists };
