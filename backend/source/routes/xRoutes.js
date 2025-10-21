const express = require('express');
const {getX} = require("../controllers/xControllers.js");

const xRoutes = express.Router();

xRoutes.get("/", getX);

module.exports = { xRoutes };