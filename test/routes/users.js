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

describe('Routes: /api/users', function () {
    beforeEach(function () {
        app.current_user = undefined;
        app.fake_user.admin = true;
    });

    describe('GET /api/users', function () {
        it('should be able to return a JSON-encoded list of Users', async function () {
            var userA = await User.generate();
            var userB = await User.generate();

            var summaries = await Promise.all([
                userA.summary(),
                userB.summary(),
            ]);

            var normalizedResult = JSON.parse(JSON.stringify(summaries));

            /* If we don't do this the testing middleware will automatically
             * make a new user, which will make this test fail
             */
            app.current_user = userA.id();

            var res = await chai.request(app)
                .get('/api/users')
                .set('Accept', 'application/json');

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.have.deep.members(normalizedResult);
        });

        it('should be able to return a CSV-formatted list of Users', async function () {
            var userA = await User.generate();
            var userB = await User.generate();

            var summaries = await Promise.all([
                userA.summary(),
                userB.summary(),
            ]);

            var normalizedResult = JSON.parse(JSON.stringify(summaries));

            app.current_user = userA.id();
            var res = await chai.request(app)
                .get('/api/users')
                .set('Accept', 'text/csv');

            expect(res).to.have.status(200);
            expect(res.headers['content-type']).to.include('text/csv');

            res.body = routing_common.parseCSV(res.text);
            return expect(res.body).to.eventually.have.deep.members(normalizedResult);
        });
    });

    describe('POST /api/users', function () {
        it('should create new Users', async function () {
            /* This is the payload we test against for equality.
             * (for obvious reasons, the server can't / doesn't echo the password back)
             */
            var payload = {
                username: 'username',
                realname: 'realname',
                activityCreator: true,
                inventoryEditor: true,
                requestEditor: true,
                attendanceEditor: true,
                admin: true,
                disabled: true,
            };

            // payload to send to server
            var actual_payload = Object.assign({ password: 'password', }, payload);

            var res = await chai.request(app)
                .post('/api/users')
                .set('Accept', 'application/json')
                .send(actual_payload).catch(req_common.catch_failed_requests);

            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body).to.deep.include(payload);

            expect(res.body).to.have.own.property('id');
            expect(res.body.id).to.be.a('string');
            var createdObject = new User(res.body.id);
            expect(createdObject.exists()).to.become(true);

            var normalizedResult = JSON.parse(JSON.stringify(await createdObject.summary()));
            expect(res.body).to.eql(normalizedResult);
        });

        it('should reject requests with missing parameters', async function () {
            var res = await chai.request(app)
                .post('/api/users')
                .set('Accept', 'application/json')
                .send({}).catch(req_common.pass_failed_requests);

            expect(res).to.have.status(400);
        });

        it('should reject requests from non-administrators', async function () {
            app.fake_user.admin = false;
            var res = await chai.request(app)
                .post('/api/users')
                .set('Accept', 'application/json')
                .send({}).catch(req_common.pass_failed_requests);

            expect(res).to.have.status(403);
        });
    });

    describe('PUT /api/users', function () {
        it('should update the entire collection of Users', async function () {
            var userA = await User.generate();
            var userB = await User.generate();

            var tested_payload = [
                {
                    username: await userA.username(),
                    realname: 'User A',
                    admin: false,
                    activityCreator: false,
                    inventoryEditor: false,
                    requestEditor: false,
                    attendanceEditor: false,
                    disabled: false
                },
                {
                    username: 'userD',
                    realname: 'User D',
                    admin: true,
                    activityCreator: true,
                    inventoryEditor: true,
                    requestEditor: true,
                    attendanceEditor: true,
                    disabled: true
                }
            ];

            var actual_payload = tested_payload.map(x => Object.assign({ password: 'password' }, x));

            var res = await chai.request(app)
                .put('/api/users')
                .set('Accept', 'application/json')
                .send(actual_payload).catch(req_common.catch_failed_requests);

            expect(res).to.have.status(200);
            expect(res).to.be.json;

            var collection = (await dbAPI.users.find({}, {})).map(x => new User(x._id));
            collection = await Promise.all(collection.map(x => x.summary()));

            /* Test to see if response data matches server data */
            var normalizedResult = JSON.parse(JSON.stringify(collection));
            expect(res.body).to.have.deep.members(normalizedResult);

            /* Test to see if server data matches request payload */
            expect(tested_payload).to.have.lengthOf(normalizedResult.length);
            normalizedResult.forEach(
                (server_object) => {
                    var payload_object = tested_payload.find(x => x.username === server_object.username);
                    expect(payload_object).to.exist;
                    expect(server_object).to.deep.include(payload_object);
                }
            );
        });

        it('should accept CSV-formatted data in addition to JSON-encoded data', async function () {
            var userA = await User.generate();
            var userB = await User.generate();

            var tested_payload = [
                {
                    username: await userA.username(),
                    realname: 'User A',
                    admin: false,
                    activityCreator: false,
                    inventoryEditor: false,
                    requestEditor: false,
                    attendanceEditor: false,
                    disabled: false
                },
                {
                    username: 'userD',
                    realname: 'User D',
                    admin: true,
                    activityCreator: true,
                    inventoryEditor: true,
                    requestEditor: true,
                    attendanceEditor: true,
                    disabled: true
                }
            ];

            var actual_payload = tested_payload.map(x => Object.assign({ password: 'password' }, x));
            actual_payload = await routing_common.stringifyCSV(actual_payload);

            var res = await chai.request(app)
                .put('/api/users')
                .set('Accept', 'text/csv')
                .type('text/csv')
                .send(actual_payload);

            expect(res).to.have.status(200);
            expect(res.headers['content-type']).to.include('text/csv');
            res.body = await routing_common.parseCSV(res.text);

            var collection = (await dbAPI.users.find({}, {})).map(x => new User(x._id));
            collection = await Promise.all(collection.map(x => x.summary()));
            var normalizedResult = JSON.parse(JSON.stringify(collection));

            expect(res.body).to.have.deep.members(normalizedResult);

            expect(tested_payload).to.have.lengthOf(normalizedResult.length);
            normalizedResult.forEach(
                (server_object) => {
                    var payload_object = tested_payload.find(x => x.username === server_object.username);
                    expect(payload_object).to.exist;
                    expect(server_object).to.deep.include(payload_object);
                }
            );
        });

        it('should not affect IDs of updated Users', async function () {
            var userA = await User.generate();

            var tested_payload = [
                {
                    username: await userA.username(),
                    realname: 'User A',
                    admin: true,
                    activityCreator: true,
                    inventoryEditor: true,
                    requestEditor: true,
                    attendanceEditor: true,
                    disabled: true
                }
            ];

            var actual_payload = tested_payload.map(x => Object.assign({ password: 'password' }, x));

            var res = await chai.request(app)
                .put('/api/users')
                .set('Accept', 'application/json')
                .send(actual_payload)
                .catch(req_common.catch_failed_requests);

            userA = new User(userA.id());
            var normalizedResult = JSON.parse(JSON.stringify(await userA.summary()));

            expect(await dbAPI.users.count({})).to.equal(1);
            expect(await userA.exists()).to.be.true;
            expect(normalizedResult).to.deep.include(tested_payload[0]);
        });

        it('should return 403 Forbidden for nonadmins', async function () {
            app.fake_user.admin = false;
            var res = await chai.request(app)
                .put('/api/users')
                .set('Accept', 'application/json')
                .send({})
                .catch(req_common.pass_failed_requests);

            expect(res).to.have.status(403);
        });
    });

    describe('All Routes - /api/users/:uid', function () {
        it('should return 404 Not Found for nonexistent users', async function () {
            var res = await chai.request(app)
                .get('/api/users/'+monk.id().toString())
                .set('Accept', 'application/json')
                .catch(req_common.pass_failed_requests);

            expect(res).to.have.status(404);
        });

        it('should return 403 Forbidden for nonadmins', async function () {
            var user = await User.generate();

            app.fake_user.admin = false;
            var res = await chai.request(app)
                .get('/api/users/'+user.id().toString())
                .set('Accept', 'application/json')
                .catch(req_common.pass_failed_requests);

            expect(res).to.have.status(403);
        });
    });

    describe('GET /api/users/:uid', function () {
        it('should return information on a specific User', async function () {
            var user = await User.generate();

            var res = await chai.request(app)
                .get('/api/users/'+user.id().toString())
                .set('Accept', 'application/json')
                .catch(req_common.catch_failed_requests);

            expect(res).to.have.status(200);
            expect(res).to.be.json;

            var normalizedResult = JSON.parse(JSON.stringify(await user.summary()))
            expect(res.body).to.deep.include(normalizedResult);
        });
    });

    describe('PUT /api/users/:uid', function () {
        it('should update a specific User', async function () {
            var user = await User.generate();
            var payload = {
                username: 'userA',
                realname: 'User A',
                admin: true,
                activityCreator: true,
                inventoryEditor: true,
                requestEditor: true,
                attendanceEditor: true,
                disabled: true
            };

            var old_summary = JSON.parse(JSON.stringify(await user.summary()));

            var res = await chai.request(app)
                .put('/api/users/'+user.id().toString())
                .set('Accept', 'application/json')
                .send(payload)
                .catch(req_common.catch_failed_requests);

            expect(res).to.have.status(200);
            expect(res).to.be.json;

            user = new User(user.id());
            var normalizedResult = JSON.parse(JSON.stringify(await user.summary()));

            expect(old_summary).to.not.eql(normalizedResult);
            expect(res.body).to.deep.include(normalizedResult);
            expect(normalizedResult).to.deep.include(payload);
        });
    });

    describe('DELETE /api/users/:uid', function () {
        it('should delete a specific User', async function () {
            var user = await User.generate();
            var res = await chai.request(app)
                .delete('/api/users/'+user.id().toString())
                .catch(req_common.catch_failed_requests);

            expect(res).to.have.status(204);
            expect(res.body).to.be.empty;

            user = new User(user.id());
            return expect(user.exists()).to.become(false);
        });
    });

    describe('POST /api/users/:uid/password', function () {
        it("should set a specific User's password", async function () {
            var user = await User.generate();
            var passwordA = 'FoobarA';
            var passwordB = 'FoobarB';
            await user.setPassword(passwordA);

            var res = await chai.request(app)
                .post(`/api/users/${user.id().toString()}/password`)
                .type('text/plain')
                .send(passwordB).catch(req_common.catch_failed_requests);

            expect(res).to.have.status(204);
            expect(res.body).to.be.empty;

            user = new User(user.id());
            expect(await user.validatePassword(passwordA)).to.be.false;
            expect(await user.validatePassword(passwordB)).to.be.true;
        });
    });
});
