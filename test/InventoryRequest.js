var dbAPI = require('api/db.js');
var User = require('api/models/User.js');
var Item = require('api/models/Item.js');
var InventoryRequest = require('api/models/InventoryRequest.js');

var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;

var chai = require('chai');
chai.use(require('chai-datetime'));
chai.use(require('chai-as-promised'));
should = chai.should();

var common = require('test/support/model_common.js');

describe('InventoryRequest', function () {
    afterEach(async function() {
        await Promise.all([
            dbAPI.users.remove({}),
            dbAPI.inventory.remove({}),
            dbAPI.requests.remove({}),
        ]);
    });

    describe('#count()', function () {
        common.numeric_prop_tests(dbAPI.requests, InventoryRequest, 'count');
    });

    describe('#item()', function () {
        common.model_prop_tests(dbAPI.requests, InventoryRequest, 'item', Item);
    });

    describe('#requester()', function () {
        common.model_prop_tests(dbAPI.requests, InventoryRequest, 'requester', User);
    });

    describe('#status()', function () {
        common.generic_prop_tests(InventoryRequest, 'status', 'waiting');

        const valid_statuses = ['waiting', 'in_progress', 'delayed', 'fulfilled'];
        valid_statuses.forEach(function (param) {
            it(`should accept '${param}' as a valid status from the database`, async function () {
                var doc = await dbAPI.requests.insert({ status: param });
                var instance = new InventoryRequest(doc._id);

                return instance.status().should.become(param);
            });

            it(`should accept '${param}' as a valid status as a property value`, async function () {
                var instanceA = new InventoryRequest();
                await instanceA.status(param);
                await instanceA.save();

                var instanceB = new InventoryRequest(instanceA.id());
                return instanceB.status().should.become(param);
            });
        });

        it('should reject other values as property values', async function () {
            var instance = new InventoryRequest();
            return instance.status('foobar').should.be.rejected;
        });
    })

    describe('#eta()', function () {
        common.date_prop_tests(dbAPI.requests, InventoryRequest, 'eta');
    });

    describe('#summary()', function () {
        common.summary_tests(dbAPI.requests, InventoryRequest, {
            count: 10,
            status: 'waiting',
            eta: new Date()
        });
    })
})
