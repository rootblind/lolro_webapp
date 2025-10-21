const express = require("express");
const {getTest, postTest, putTest, deleteTest, getTestById} = require("../controllers/testController.js");

const testRounter = express.Router();


testRounter.get("/", getTest);
testRounter.get("/:id", getTestById);
testRounter.post("/", postTest);
testRounter.put("/:id", putTest);
testRounter.delete("/:id", deleteTest);

module.exports = {
    testRounter
};