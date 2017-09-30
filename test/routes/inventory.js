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
var app = req_common.isolate_module(require('api/inventory.js'));

describe('Routes: /api/inventory', function () {
    beforeEach(function () {
        app.fake_user.admin = true;
    });

    afterEach(async function () {
        return dbAPI.inventory.remove({});
    });

    describe('GET /api/inventory', function () {
        it("should respond with a JSON array of Item objects", async function () {
            var itemA = await Item.generate();
            var itemB = await Item.generate();

            var summaryList = await Promise.all([
                itemA.summary(),
                itemB.summary(),
            ]);

            summaryList = JSON.parse(JSON.stringify(summaryList));

            var res = await chai.request(app)
                .get('/api/inventory')
                .set('Accept', 'application/json');

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.eql(summaryList);
        });

        it("should also respond with a CSV-formatted list of Item objects", async function () {
            var itemA = await Item.generate();
            var itemB = await Item.generate();

            var summaryList = await Promise.all([
                itemA.summary(),
                itemB.summary(),
            ]);

            summaryList = JSON.parse(JSON.stringify(summaryList));

            var res = await chai.request(app)
                .get('/api/inventory')
                .set('Accept', 'text/csv');

            expect(res).to.have.status(200);
            expect(res.header['content-type']).to.include('text/csv');
            var body = await routing_common.parseCSV(res.text);

            expect(body).to.eql(summaryList);
        });
    });

    describe('GET /api/inventory.csv', function () {
        it("should respond with a CSV-formatted list of Item objects as an attachment", async function () {
            var itemA = await Item.generate();
            var itemB = await Item.generate();

            var summaryList = await Promise.all([
                itemA.summary(),
                itemB.summary(),
            ]);

            summaryList = JSON.parse(JSON.stringify(summaryList));

            var res = await chai.request(app).get('/api/inventory.csv');

            expect(res).to.have.status(200);
            expect(res.header['content-type']).to.include('text/csv');
            expect(res.header['content-disposition']).to.include('attachment');
            var body = await routing_common.parseCSV(res.text);

            expect(body).to.eql(summaryList);
        });
    });

    describe('POST /api/inventory', function () {
        it('should create a new Item', async function () {
            var payload = { name: 'test', count: 5 };
            var res = await chai.request(app)
                .post('/api/inventory')
                .set('Accept', 'application/json')
                .send(payload);

            expect(res).to.have.status(201); // status code: 201 Created
            expect(res).to.be.json;
            res.body.should.be.an('object');
            res.body.should.deep.include(payload);

            res.body.should.have.own.property('id');
            res.body.id.should.be.a('string');
            var createdObject = new Item(res.body.id);

            expect(createdObject.exists()).to.become(true);
            var normalizedResult = JSON.parse(JSON.stringify(await createdObject.summary()));

            res.body.should.eql(normalizedResult);
        });

        it('should reject requests with missing parameters', async function () {
            var res = await chai.request(app)
                .post('/api/inventory')
                .set('Accept', 'application/json')
                .send({}).catch((err) => { return err.response; });

            expect(res).to.have.status(400); // 400 Bad Request
        });

        it('should reject attempts to create Items with duplicate names', async function () {
            var itemA = await Item.generate();

            var res = await chai.request(app)
                .post('/api/inventory')
                .set('Accept', 'application/json')
                .send({
                    name: await itemA.name(),
                    count: 500
                }).catch((err) => { return err.response; });

            expect(res).to.have.status(400); // 400 Bad Request
        });
    });

    describe('PUT /api/inventory', function () {
        it('should accept JSON-encoded arrays of Item objects to replace the collection', async function () {
            var payload = [
                { name: 'Foo', count: 42 },
                { name: 'Bar', count: 1337 },
            ];

            var [itemA, itemB] = await Promise.all([
                Item.generate(),
                Item.generate(),
            ]);

            var res = await chai.request(app)
                .put('/api/inventory')
                .set('Accept', 'application/json')
                .send(payload).catch(req_common.catch_failed_requests);

            expect(res).to.have.status(200);
            expect(res).to.be.json;

            // get the collection's documents as summaries
            var newCollection = (await dbAPI.inventory.find({}, {})).map(d => (new Item(d._id)).summary());
            var normalizedResult = JSON.parse(JSON.stringify(await Promise.all(newCollection)));

            expect(normalizedResult).to.have.lengthOf(2);
            payload.forEach(
                (payloadElem) => {
                    var correspondingResult = normalizedResult.find(x => x.name === payloadElem.name);
                    expect(correspondingResult).to.deep.include(payloadElem);
                }
            );

            expect(res.body).to.deep.equal(normalizedResult);
            return Promise.all([
                expect(itemA.exists()).to.become(false),
                expect(itemB.exists()).to.become(false),
            ]);
        });

        it('should accept CSV-formatted lists of Item objects to replace the collection', async function () {
            var payload = [
                { name: 'Foo', count: 42 },
                { name: 'Bar', count: 1337 },
            ];

            var [itemA, itemB] = await Promise.all([
                Item.generate(),
                Item.generate(),
            ]);

            var res = await chai.request(app)
                .put('/api/inventory')
                .set('Accept', 'text/csv')
                .set('Content-Type', 'text/csv')
                .send(await routing_common.stringifyCSV(payload))
                .catch(req_common.catch_failed_requests);

            expect(res).to.have.status(200);
            expect(res.header['content-type']).to.include('text/csv');
            res.body = await routing_common.parseCSV(res.text);

            // get the collection's documents as summaries
            var newCollection = (await dbAPI.inventory.find({}, {})).map(d => (new Item(d._id)).summary());
            var normalizedResult = JSON.parse(JSON.stringify(await Promise.all(newCollection)));

            expect(normalizedResult).to.have.lengthOf(payload.length);
            payload.forEach(
                (payloadElem) => {
                    var correspondingResult = normalizedResult.find(x => x.name === payloadElem.name);
                    expect(correspondingResult).to.deep.include(payloadElem);
                }
            );

            expect(res.body).to.deep.equal(normalizedResult);
            return Promise.all([
                expect(itemA.exists()).to.become(false),
                expect(itemB.exists()).to.become(false),
            ]);
        });

        it('should reject requests from non-admins with 403 Forbidden', async function () {
            app.fake_user.admin = false;

            var res = await chai.request(app)
                .put('/api/inventory')
                .set('Accept', 'application/json')
                .send({}).catch((err) => { return err.response; });

            expect(res).to.have.status(403);
        });
    })

    describe('All Methods - /api/inventory/:iid', function () {
        it('should return 404 Not Found for nonexistent Items', async function () {
            var res = await chai.request(app)
                .get('/api/inventory/'+monk.id().toString())
                .set('Accept', 'application/json')
                .send({}).catch((err) => { return err.response; });

            expect(res).to.have.status(404);
        });
    });

    describe('GET /api/inventory/:iid', function () {
        it('should retrieve a specific Item by ID and return it', async function () {
            var item = await Item.generate();
            var normalizedResult = JSON.parse(JSON.stringify(await item.summary()));

            var res = await chai.request(app)
                .get('/api/inventory/'+item.id().toString())
                .set('Accept', 'application/json');

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.eql(normalizedResult);
        });
    });

    describe('PUT /api/inventory/:iid', function () {
        it('should update a specific Item by ID and return the updated version', async function () {
            var item = await Item.generate();

            var payload = {
                name: 'Foobar',
                count: 9999
            };

            var oldSummary = JSON.parse(JSON.stringify(await item.summary()));

            var res = await chai.request(app)
                .put('/api/inventory/'+item.id().toString())
                .set('Accept', 'application/json')
                .send(payload);

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.deep.include(payload);

            var normalizedResult = JSON.parse(JSON.stringify(await item.summary()));
            expect(oldSummary).to.not.eql(normalizedResult);
            expect(normalizedResult).to.deep.include(payload);
            expect(res.body).to.eql(normalizedResult);
        });

        it('should reject requests that would cause available Item counts to go negative', async function () {
            var itemA = await Item.generate();
            var rsvp = new Reservation();

            await Promise.all([
                rsvp.part(itemA),
                rsvp.count(await itemA.count())
            ]);
            await rsvp.save();

            var payload = {
                name: 'Foobar',
                count: (await itemA.count())-1
            };

            var oldSummary = await itemA.summary();

            var res = await chai.request(app)
                .put('/api/inventory/'+itemA.id().toString())
                .set('Accept', 'application/json')
                .send(payload).catch(req_common.pass_failed_requests);

            expect(res).to.have.status(400);
        });

        after(async function () {
            return Promise.all([
                dbAPI.reservations.remove({}),
                dbAPI.users.remove({}),
            ])
        })
    })

    describe('DELETE /api/inventory/:iid', function () {
        it('should delete Items from the database', async function () {
            var item = await Item.generate();
            var normalizedResult = JSON.parse(JSON.stringify(await item.summary()));

            var res = await chai.request(app)
                .delete('/api/inventory/'+item.id().toString());

            expect(res).to.have.status(204);
            expect(res.body).to.be.empty;

            item = new Item(item.id());
            return expect(item.exists()).to.become(false);
        });
    });
})
