var dbAPI = require('api/db.js');
var Item = require('api/models/Item.js');
var User = require('api/models/User.js');
var Reservation = require('api/models/Reservation.js');

var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;

var chai = require('chai');
chai.use(require('chai-as-promised'));
should = chai.should();

var common = require('test/support/model_common.js');

describe('Reservation', function() {
    var testItemName = 'Foobar';
    var testString = 'batman';
    var testCount = 42;
    var testNumericString = '42';

    afterEach(function() {
        /* Completely clear Inventory and Reservation collections. */
        dbAPI.inventory.remove({});
        dbAPI.reservations.remove({});
    });

    describe('#count()', common.numeric_prop_tests.bind(null, dbAPI.reservations, Reservation, 'count'));

    describe('#part()', function() {
        it('should return null if the property is not set', async function() {
            var testRSVP = new Reservation();
            testRSVP.part().should.become(null);
        })

        it("should save and load Item objects", async function() {
            var testRSVP = new Reservation();
            var rid = testRSVP.id();
            var testItem = new Item();
            await testItem.save();

            await testRSVP.part(testItem);
            await testRSVP.save();

            testRSVP = new Reservation(rid);
            var loadedItem = await testRSVP.part();

            loadedItem.should.satisfy(x => x instanceof Item);
            loadedItem.id().should.satisfy(testItem.id().equals);
        });

        it("should accept an Item's ID and return an Item object", async function() {
            var testRSVP = new Reservation();
            var rid = testRSVP.id();
            var testItem = new Item();
            await testItem.save();

            await testRSVP.part(testItem.id().toString());
            await testRSVP.save();

            testRSVP = new Reservation(rid);
            var loadedItem = await testRSVP.part();

            loadedItem.should.satisfy(x => x instanceof Item);
            loadedItem.id().should.satisfy(testItem.id().equals);
        });
    });

    describe.skip('#requester()', function() {
        it('should return a User', async function() {

        });

        it('should accept a User', async function() {

        });

        it("should accept a User's ID", async function() {

        });
    });


    describe.skip('#summary()', function() {

    });
});
