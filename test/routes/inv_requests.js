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
var InventoryRequest = require('api/models/InventoryRequest.js');
var app = req_common.isolate_module(require('api/inv_requests.js'));

describe('Routes: /api/requests', function () {
    afterEach(async function () {
        return Promise.all([
            dbAPI.users.remove({}),
            dbAPI.inventory.remove({}),
            dbAPI.requests.remove({}),
        ]);
    });

    describe('GET /api/requests', function () {
        it('should return a JSON-encoded array of Inventory Request objects', async function () {
            var reqUser = await User.generate();
            var reqItem = await Item.generate();

            var serverInstances = [5, 10].map(async (count) => {
                var instance = new InventoryRequest();
                await Promise.all([
                    instance.item(reqItem),
                    instance.requester(reqUser),
                    instance.count(count),
                    instance.status('waiting')
                ]);
                await instance.save();

                return instance;
            });
            serverInstances = await Promise.all(serverInstances);

            var res = await chai.request(app)
                .get('/api/requests')
                .set('Accept', 'application/json');

            expect(res).to.have.status(200);
            expect(res).to.be.json;

            var collection = await Promise.all(serverInstances.map(
                (instance) => instance.summary()
            ));

            /* serialize and then deserialize stuff on the 'server'-side
             * mainly to account for deep-eql not working for ObjectIDs
             */
            var normalizedResult = JSON.parse(JSON.stringify(collection));
            res.body.should.deep.equal(normalizedResult);
        });
    });

    describe('POST /api/requests', function () {
        it('should accept and create a new Inventory Request object', async function () {
            var reqUser = await User.generate();
            var reqItem = await Item.generate();

            // no issues with ObjectIDs here -- they're strings
            var newObject = {
                requester: reqUser.id().toString(),
                item: reqItem.id().toString(),
                count: 10,
                status: 'waiting',
                eta: new Date().toISOString()
            };

            var res = await chai.request(app)
                .post('/api/requests')
                .set('Accept', 'application/json')
                .send(newObject);

            expect(res).to.have.status(201); // status code: 201 Created
            expect(res).to.be.json;
            res.body.should.be.an('object');
            res.body.should.deep.include(newObject);

            res.body.should.have.own.property('id');
            res.body.id.should.be.a('string');
            var createdObject = new InventoryRequest(res.body.id);

            expect(createdObject.exists()).to.become(true);
            var normalizedResult = JSON.parse(JSON.stringify(await createdObject.summary()));

            res.body.should.eql(normalizedResult);
        });

        it('should reject requests with missing parameters', async function () {
            var res = await chai.request(app)
                .post('/api/requests')
                .set('Accept', 'application/json')
                .send({}).catch((err) => { return err.response; });

            expect(res).to.have.status(400); // 400 Bad Request
        });
    });

    describe('All Methods - /api/requests/:qid', function () {
        it('should 404 for nonexistent objects', async function () {
            var res = await chai.request(app)
                .get('/api/requests/'+monk.id().toString())
                .set('Accept', 'application/json')
                .send({}).catch((err) => { return err.response; });

            expect(res).to.have.status(404); // 404 Not Found
        });
    });

    describe('GET /api/requests/:qid', function () {
        it('should return a single JSON-encoded Inventory Request', async function () {
            var reqUser = await User.generate();
            var reqItem = await Item.generate();

            var serverInstance = new InventoryRequest();
            await Promise.all([
                serverInstance.item(reqItem),
                serverInstance.requester(reqUser),
                serverInstance.count(50),
                serverInstance.status('waiting')
            ]);
            await serverInstance.save();

            var res = await chai.request(app)
                .get('/api/requests/'+serverInstance.id().toString())
                .set('Accept', 'application/json');

            expect(res).to.have.status(200);
            expect(res).to.be.json;

            /* serialize and then deserialize stuff on the 'server'-side
             * mainly to account for deep-eql not working for ObjectIDs
             */
            var normalizedResult = JSON.parse(JSON.stringify(await serverInstance.summary()));
            res.body.should.deep.equal(normalizedResult);
        });
    });

    describe('PUT /api/requests/:qid', function () {
        it('should update Inventory Requests', async function () {
            var reqUser = await User.generate();
            var reqItem = await Item.generate();

            var reqUser2 = await User.generate();
            var reqItem2 = await Item.generate();

            var serverInstance = new InventoryRequest();
            await Promise.all([
                serverInstance.item(reqItem),
                serverInstance.requester(reqUser),
                serverInstance.count(50),
                serverInstance.status('waiting'),
                serverInstance.eta(new Date())
            ]);
            await serverInstance.save();

            var payload = {
                item: reqUser2.id().toString(),
                requester: reqItem2.id().toString(),
                count: 100,
                status: 'delayed',
                eta: new Date(Date.now()+1000*3600).toISOString()
            };

            var res = await chai.request(app)
                .put('/api/requests/'+serverInstance.id().toString())
                .set('Accept', 'application/json')
                .send(payload);

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.deep.include(payload);

            var normalizedResult = JSON.parse(JSON.stringify(await serverInstance.summary()));
            expect(normalizedResult).to.deep.include(payload);
            res.body.should.eql(normalizedResult);
        });
    });

    describe('DELETE /api/requests/:qid', function () {
        it('should delete Inventory Requests', async function () {
            var reqUser = await User.generate();
            var reqItem = await Item.generate();

            var serverInstance = new InventoryRequest();
            await Promise.all([
                serverInstance.item(reqItem),
                serverInstance.requester(reqUser),
                serverInstance.count(50),
                serverInstance.status('waiting')
            ]);
            await serverInstance.save();

            var res = await chai.request(app)
                .delete('/api/requests/'+serverInstance.id().toString());

            expect(res).to.have.status(204);
            expect(res.body).to.be.empty;

            serverInstance = new InventoryRequest(serverInstance.id());
            return serverInstance.exists().should.become(false);
        });
    });
});
