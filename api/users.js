var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');

var dbAPI = require('api/db.js');
var common = require('api/routing_common.js');

var User = require('api/models/User.js');

var router = express.Router();
router.use(bodyParser.json());



module.exports = router;
