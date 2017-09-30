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

var User = require('api/models/User.js');

module.exports = {
    isolate_module: isolate_module,
    catch_failed_requests: catch_failed_requests,
    pass_failed_requests: pass_failed_requests
};

/* Formats and re-throws failed Superagent / Chai-HTTP requests. */
function catch_failed_requests(err) {
    throw new Error(`Server returned error response ${err.response.status}: ${err.response.text}`);
}

/* Allows failed requests to pass through as a response result; */
function pass_failed_requests(err) {
    return err.response;
}

/* Creates an express app and mounts the given router under '/api/'. */
function isolate_module(router) {
    var app = express();

    /* Mimic a user, for testing permissions */
    app.fake_user = {
        username: 'mocha',
        realname: 'Test User',
        admin: true,
        activityCreator: true,
        disabled: false
    };

    app.use('/api', common.asyncMiddleware(
        async (req, res, next) => {
            var fake_user = new User();
            await Promise.all([
                fake_user.username(app.fake_user.username),
                fake_user.realname(app.fake_user.realname),
                fake_user.admin(app.fake_user.admin),
                fake_user.disabled(app.fake_user.disabled),
                fake_user.activityCreator(app.fake_user.activityCreator),
            ]);

            req.user = fake_user;
            next();
        }
    ));

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
