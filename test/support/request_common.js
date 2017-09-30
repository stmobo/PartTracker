var express = require('express');
var dbAPI = require('api/db.js');
var common = require('api/routing_common.js');
var util = require('util');
var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;

var type = require('type-detect');

var chai = require('chai');
chai.use(require('chai-as-promised'));
should = chai.should();
expect = chai.expect;


module.exports = {
    isolate_module: isolate_module,
};

/* Creates an express app and mounts the given router under '/api/'. */
function isolate_module(router) {
    var app = express();
    app.use('/api', router);

    /* Also mount error-handling middleware. */
    app.use((err, req, res, next) => {
        if(err instanceof common.APIClientError) {
            res.status(err.resCode).send(err.message);
        } else if(err instanceof Error) {
            res.status(500).send(err.stack);
        } else {
            res.status(400).send(err.toString());
        }
    });

    return app;
}
