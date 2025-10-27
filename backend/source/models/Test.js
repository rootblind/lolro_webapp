const {poolConnection} = require('../config/database');

const Test = new Promise((resolve, reject) => {
    resolve("x");
});

module.exports = { Test };