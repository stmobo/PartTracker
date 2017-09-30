var express = require('express');
var util = require('util');
var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var type = require('type-detect');
var chai = require('chai');

chai.use(require('chai-http'));
chai.use(require('chai-as-promised'));
should = chai.should();
expect = chai.expect;

var dbAPI = require('api/db.js');
var routing_common = require('api/routing_common.js');
var req_common = require('test/support/request_common.js')

var User = require('api/models/User.js');
var app = req_common.isolate_module(require('api/users.js'));

describe('Routes: /api/user', function () {
    beforeEach(function () {
        app.current_user = undefined;
        app.fake_user.admin = true;
    });

    describe('GET /api/user', function () {
        it('should get information about the current user', async function () {
            var current_user = await User.generate();
            var normalizedResult = JSON.parse(JSON.stringify(await current_user.summary()));

            app.current_user = current_user.id();
            var res = await chai.request(app)
                .get('/api/user')
                .set('Accept', 'application/json');

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.eql(normalizedResult);
        });
    });

    describe('POST /api/user/password', function () {
        it("should set the current user's password", async function () {
            var current_user = await User.generate();
            var passwordA = 'FoobarA';
            var passwordB = 'FoobarB';
            await current_user.setPassword(passwordA);

            app.current_user = current_user.id();
            var res = await chai.request(app)
                .post('/api/user/password')
                .type('text/plain')
                .send(passwordB).catch(req_common.catch_failed_requests);

            expect(res).to.have.status(204);
            expect(res.body).to.be.empty;

            current_user = new User(current_user.id());
            expect(await current_user.validatePassword(passwordA)).to.be.false;
            expect(await current_user.validatePassword(passwordB)).to.be.true;
        });
    });
});
