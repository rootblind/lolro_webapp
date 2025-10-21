const {poolConnection} = require("../config/database.js");

const getTest = async (req, res) => {
    try{
        const {rows: allTests} = await poolConnection.query(`SELECT * FROM testweb`);
        res.status(200).json(allTests);
    } catch(err) {
        console.error(err);
        res.status(500).json({message: "error"});
    }
}

const getTestById = async (req, res) => {
    try {
        const {rows: test} = await poolConnection.query(`SELECT * FROM testweb WHERE id=$1`, [req.params.id]);

        if(test.length == 0)
            throw new Error("No test found");

        res.status(200).json(test[0]);

    } catch(err) {
        res.status(500).json({message: err.message})
    }
}

const postTest = async (req, res) => {
    try {
        const {name} = req.body;

        const newTest = await poolConnection.query(`INSERT INTO testweb(name) VALUES($1) RETURNING *`, [name]);
        res.status(201).json(newTest.rows[0]);
    } catch(err) {
        console.error(err);
        res.status(500).json({message: err.message});
    }
}

const putTest = async (req, res) => {
    try{
        const {name} = req.body;
        const updatedTest = await poolConnection.query(`UPDATE testweb SET name=$1 WHERE id=$2`,
            [name, req.params.id]
        );
        res.status(200).json(updatedTest.rows[0]);
    } catch(err) {
        console.error(err);
        res.status(500).json({message: err.message});
    }
}

const deleteTest = async (req, res) => {
    try{

        const {rows: testExists} = await poolConnection.query(`SELECT EXISTS
            (SELECT 1 FROM testweb WHERE id=$1)`, [req.params.id]);

        if(testExists[0].exists) {
            await poolConnection.query(`DELETE FROM testweb WHERE id=$1`, [req.params.id]);
            res.status(200).json({message: "Test deleted!"});
        } else {
            throw new Error("The test does not exist!");
        }
    } catch(err) {
        res.status(500).json({message: err.message})
    }
}

module.exports = {
    getTest,
    postTest,
    putTest,
    deleteTest,
    getTestById
};