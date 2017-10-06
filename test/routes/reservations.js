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

var Item = require('api/models/Item.js');
var User = require('api/models/User.js');
var Reservation = require('api/models/Reservation.js');
var app = req_common.isolate_module(require('api/reservations.js'));

async function generate_reservation(item, requester) {
    var rsvp = new Reservation();

    await Promise.all([
        rsvp.part(item),
        rsvp.requester(requester),
        rsvp.count(10)
    ]);
    await rsvp.save();

    return rsvp;
}

describe('Routes: /api/reservations', function () {
    beforeEach(function () {
        app.fake_user.admin = true;
    });

    afterEach(async function () {
        return Promise.all([
            dbAPI.inventory.remove({}),
            dbAPI.users.remove({}),
            dbAPI.reservations.remove({}),
        ])
    });

    describe('GET /api/reservations', function () {
        it('should retrieve all Reservations in the database', async function () {
            var collection = await Promise.all([
                generate_reservation(await Item.generate(), await User.generate()),
                generate_reservation(await Item.generate(), await User.generate()),
            ]);

            var summaries = await Promise.all(collection.map(x => x.summary()));
            var normalizedResult = JSON.parse(JSON.stringify(summaries));

            var res = await chai.request(app)
                .get('/api/reservations')
                .set('Accept', 'application/json');

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.have.deep.members(normalizedResult);
        });
    });

    describe('POST /api/reservations', function () {
        it('should create a new Reservation', async function () {
            var item = await Item.generate();
            var user = await User.generate();

            var payload = {
                part: item.id().toString(),
                requester: user.id().toString(),
                count: await item.count()-5
            };

            var res = await chai.request(app)
                .post('/api/reservations')
                .set('Accept', 'application/json')
                .send(payload);

            expect(res).to.have.status(201); // 201 Created
            expect(res).to.be.json;
            expect(res.body).to.deep.include(payload);

            var createdObject = new Reservation(res.body.id);
            expect(await createdObject.exists()).to.be.true;

            var normSummary = JSON.parse(JSON.stringify( await createdObject.summary() ));
            expect(normSummary).to.eql(res.body);
        });

        it('should reject Reservations with missing properties', async function () {
            var res = await chai.request(app)
                .post('/api/reservations')
                .set('Accept', 'application/json')
                .send({}).catch(req_common.pass_failed_requests);

            expect(res).to.have.status(400);
        });

        it('should reject Reservations from unknown Users with 404 Not Found', async function () {
            var item = await Item.generate();
            var payload = {
                part: item.id().toString(),
                requester: monk.id(),
                count: await item.count()-5
            };

            var res = await chai.request(app)
                .post('/api/reservations')
                .set('Accept', 'application/json')
                .send(payload).catch(req_common.pass_failed_requests);

            expect(res).to.have.status(404);
        });

        it('should reject Reservations for unknown Items with 404 Not Found', async function () {
            var user = await User.generate();
            var payload = {
                part: monk.id(),
                requester: user.id().toString(),
                count: 5
            };

            var res = await chai.request(app)
                .post('/api/reservations')
                .set('Accept', 'application/json')
                .send(payload).catch(req_common.pass_failed_requests);

            expect(res).to.have.status(404);
        });

        it('should reject Reservations that would make available Item counts go below zero', async function () {
            var item = await Item.generate();
            var user = await User.generate();

            var payload = {
                part: item.id().toString(),
                requester: user.id().toString(),
                count: await item.count()+5
            };

            var res = await chai.request(app)
                .post('/api/reservations')
                .set('Accept', 'application/json')
                .send(payload).catch(req_common.pass_failed_requests);

            expect(res).to.have.status(400);
        });
    })

    describe('All Routes - /api/reservations/:rid', function () {
        it('should respond with 404 Not Found for nonexistent Reservations.', async function () {
            var res = await chai.request(app)
                .get('/api/reservations/'+monk.id().toString())
                .set('Accept', 'application/json')
                .send({}).catch(req_common.pass_failed_requests);

            expect(res).to.have.status(404);
        });
    });

    describe('GET /api/reservations/:rid', function () {
        it('should get a specific Reservation by ID', async function () {
            var rsvp = await generate_reservation(await Item.generate(), await User.generate());
            var normalizedResult = JSON.parse(JSON.stringify(await rsvp.summary()));

            var res = await chai.request(app)
                .get('/api/reservations/'+rsvp.id().toString())
                .set('Accept', 'application/json')

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.eql(normalizedResult);
        });
    });

    describe('PUT /api/reservations/:rid', function () {
        it('should update a specific Reservation by ID', async function () {
            var rsvpA = await generate_reservation(await Item.generate(), await User.generate());
            var itemB = await Item.generate();
            var userB = await User.generate();

            var payload = {
                part: itemB.id().toString(),
                requester: userB.id().toString(),
                count: 42
            };

            var oldSummary = JSON.parse(JSON.stringify(await rsvpA.summary()));

            var res = await chai.request(app)
                .put('/api/reservations/'+rsvpA.id().toString())
                .set('Accept', 'application/json')
                .send(payload);

            expect(res).to.have.status(200);
            expect(res).to.be.json;

            var rsvpB = new Reservation(rsvpA.id());
            var newSummary = JSON.parse(JSON.stringify(await rsvpB.summary()));

            expect(oldSummary).to.not.eql(newSummary);
            expect(newSummary).to.deep.include(payload);
            expect(newSummary).to.eql(res.body);
        });

        it('should reject Reservations from unknown Users with 404 Not Found', async function () {
            var rsvp = await generate_reservation(await Item.generate(), await User.generate());
            var item = await Item.generate();
            var payload = {
                part: item.id().toString(),
                requester: monk.id(),
                count: await item.count()-5
            };

            var res = await chai.request(app)
                .put('/api/reservations/'+rsvp.id().toString())
                .set('Accept', 'application/json')
                .send(payload).catch(req_common.pass_failed_requests);

            expect(res).to.have.status(404);
        });

        it('should reject Reservations for unknown Items with 404 Not Found', async function () {
            var rsvp = await generate_reservation(await Item.generate(), await User.generate());
            var user = await User.generate();
            var payload = {
                part: monk.id(),
                requester: user.id().toString(),
                count: 5
            };

            var res = await chai.request(app)
                .put('/api/reservations/'+rsvp.id().toString())
                .set('Accept', 'application/json')
                .send(payload).catch(req_common.pass_failed_requests);

            expect(res).to.have.status(404);
        });

        it('should reject requests that would make available Item counts go below zero', async function () {
            var item = await Item.generate();
            var user = await User.generate();
            var rsvp = await generate_reservation(item, user);
            var payload = {
                part: item.id().toString(),
                requester: user.id().toString(),
                count: (await item.count())+5
            };

            var res = await chai.request(app)
                .put('/api/reservations/'+rsvp.id().toString())
                .set('Accept', 'application/json')
                .send(payload).catch(req_common.pass_failed_requests);

            expect(res).to.have.status(400);
        });
    });

    describe('DELETE /api/reservations/:rid', function () {
        it('should delete Reservations from the database', async function () {
            var rsvpA = await generate_reservation(await Item.generate(), await User.generate());
            var res = await chai.request(app).delete('/api/reservations/'+rsvpA.id().toString())

            expect(res).to.have.status(204);
            expect(res.body).to.be.empty;

            var rsvpB = new Reservation(rsvpA.id());
            return expect(rsvpB.exists()).to.become(false);
        });
    });
});
