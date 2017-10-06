var express = require('express');
var passport = require('passport');
var session = require('express-session');

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

var users_router = require('api/users.js');
var Auth = require('api/auth.js');

/* Manually construct the test app instance */
var app = express();

/* Setup session middleware */
app.use(session({ secret: 'a secret key', secure: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => { res.status(204).end(); }) // stub this endpoint, because /api/logout redirects to it
app.use('/api', Auth.router);
app.use('/api', Auth.ensureAuthenticated);
app.use('/api', users_router);
app.use(req_common.error_handler)

describe('Routes: Basic Authentication', function () {
    beforeEach(async function () {
        return dbAPI.users.remove({});
    });

    it('should be supported on all routes requiring authentication', async function () {
        var user = await User.generate();
        await user.setPassword('password');
        await user.save();

        var normalizedResult = JSON.parse(JSON.stringify(await user.summary()));

        var res = await chai.request(app)
            .get('/api/user')
            .auth(await user.username(), 'password')
            .set('Accept', 'application/json');

        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.eql(normalizedResult);
    });
});

describe('Routes: /api/login and /api/logout', function () {
    beforeEach(async function () {
        return dbAPI.users.remove({});
    });

    describe('POST /api/login', function () {
        it('should set up a login session when sent credentials as JSON', async function () {
            var user = await User.generate();
            await user.setPassword('password');
            await user.save();

            var normalizedResult = JSON.parse(JSON.stringify(await user.summary()));

            var agent = chai.request.agent(app);

            var res = await agent.post('/api/login')
                .send({ username: await user.username(), password: 'password' })
                .set('Accept', 'application/json')
                .catch(req_common.catch_failed_requests);

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res).to.have.cookie('connect.sid');
            expect(res.body).to.eql(normalizedResult);

            /* now try a request using the cookie for auth */
            res = await agent.get('/api/user')
                .set('Accept', 'application/json')
                .catch(req_common.catch_failed_requests);

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.eql(normalizedResult);
        });

        it('should set up a login session when sent credentials as application/x-www-form-urlencoded', async function () {
            var user = await User.generate();
            await user.setPassword('password');
            await user.save();

            var normalizedResult = JSON.parse(JSON.stringify(await user.summary()));

            var agent = chai.request.agent(app);

            var res = await agent.post('/api/login')
                .type('form')
                .send({ username: await user.username(), password: 'password' })
                .set('Accept', 'application/json')
                .catch(req_common.catch_failed_requests);

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res).to.have.cookie('connect.sid');
            expect(res.body).to.eql(normalizedResult);

            res = await agent.get('/api/user')
                .set('Accept', 'application/json')
                .catch(req_common.catch_failed_requests);

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.eql(normalizedResult);
        });

        it('should set up a login session when sent credentials using Basic Authentication', async function () {
            var user = await User.generate();
            await user.setPassword('password');
            await user.save();

            var normalizedResult = JSON.parse(JSON.stringify(await user.summary()));

            var agent = chai.request.agent(app);

            var res = await agent.post('/api/login')
                .auth(await user.username(), 'password')
                .send({})
                .set('Accept', 'application/json')
                .catch(req_common.catch_failed_requests);

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res).to.have.cookie('connect.sid');
            expect(res.body).to.eql(normalizedResult);

            res = await agent.get('/api/user')
                .set('Accept', 'application/json')
                .catch(req_common.catch_failed_requests);

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.eql(normalizedResult);
        });
    });

    describe('GET /api/logout', function () {
        it('should end a login session', async function () {
            var user = await User.generate();
            await user.setPassword('password');
            await user.save();

            var normalizedResult = JSON.parse(JSON.stringify(await user.summary()));

            var agent = chai.request.agent(app);

            var res = await agent.post('/api/login')
                .send({ username: await user.username(), password: 'password' })
                .set('Accept', 'application/json')
                .catch(req_common.catch_failed_requests);

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res).to.have.cookie('connect.sid');
            expect(res.body).to.eql(normalizedResult);

            res = await agent.get('/api/logout').catch(req_common.catch_failed_requests);

            expect(res).to.have.status(204);
            expect(res.body).to.be.empty;
            expect(res).to.not.have.cookie('connect.sid');

            res = await agent.get('/api/user')
                .set('Accept', 'application/json')
                .catch(req_common.pass_failed_requests);

            expect(res).to.have.status(401);
        });
    })
});
