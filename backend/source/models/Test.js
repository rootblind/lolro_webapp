const {poolConnection} = require('../config/database');

const Test = new Promise((resolve, reject) => {
    poolConnection.query(`CREATE TABLE IF NOT EXISTS testweb (
            id SERIAL PRIMARY KEY,
            name TEXT
        )`, (err, result) => {
            if(err) {
                console.error(err);
                reject(err);
            } else {
                resolve(result);
            }
        })
});

module.exports = { Test };