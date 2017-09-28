var dbAPI = require('api/db.js');
var Item = require('api/models/Item.js');

var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

var common = require('test/support/model_common.js');

describe('Item', function() {
    var testItemName = 'Foobar';
    var testString = 'batman';
    var testCount = 42;
    var testNumericString = '42';

    afterEach(function() {
        /* Completely clear Inventory collection. */
        dbAPI.inventory.remove({});
    });

    describe('#count()', function() {
        common.numeric_prop_tests(dbAPI.inventory, Item, 'count');
    });

    describe('#name()', function() {
        common.string_prop_tests(dbAPI.inventory, Item, 'name');
    });

    describe('#delete()', function() {
        it('should remove the item from the inventory', async function() {
            var newItem = await dbAPI.inventory.insert({ name: testItemName, count: testCount });
            var testItem = new Item(newItem._id);
            await testItem.delete();

            return dbAPI.inventory.findOne({ _id: newItem._id }).should.become(null);
        });
    });

    describe('#reserved()', function() {
        it('should return the number of reserved units of an item', async function() {
            /* Note that we test the non-zero case in the tests for Reservation objects. */
            var testItem = new Item();

            await testItem.count(testCount);
            await testItem.save();

            return testItem.reserved().should.become(0);
        });
    });

    describe('#available()', function() {
        it('should return the number of non-reserved units of an item', async function() {
            /* Note that we test the non-zero case in the tests for Reservation objects. */
            var testItem = new Item();

            await testItem.count(testCount);
            await testItem.save();

            return testItem.available().should.become(testCount - (await testItem.reserved()));
        });
    });

    describe('#summary()', function() {
        it("should return an object with all of an item's saved properties", async function() {
            var testItem = new Item();
            var testItemID = testItem.id();

            await Promise.all([
                testItem.name(testItemName),
                testItem.count(testCount)
            ]);

            await testItem.save();

            testItem = new Item(testItem.id());
            var testItemSummary = await testItem.summary();

            testItemSummary.should.have.own.property('id');
            testItemSummary.id.should.satisfy(x => x instanceof ObjectID);

            testItemSummary.should.have.own.property('name');
            testItemSummary.name.should.equal(testItemName);

            testItemSummary.should.have.own.property('count');
            testItemSummary.count.should.equal(testCount);

            testItemSummary.should.have.own.property('updated');
            testItemSummary.updated.should.be.a('date');

            testItemSummary.should.have.own.property('created');
            testItemSummary.created.should.be.a('date');
        });

        it("should calculate how many units of an item are reserved and available", async function() {
            var testItem = new Item();
            var testItemID = testItem.id();

            await Promise.all([
                testItem.name(testItemName),
                testItem.count(testCount)
            ]);

            await testItem.save();

            testItem = new Item(testItem.id());
            var testItemSummary = await testItem.summary();

            testItemSummary.should.have.own.property('reserved');
            testItemSummary.reserved.should.equal(0);

            testItemSummary.should.have.own.property('available');
            testItemSummary.available.should.equal(testCount);
        });
    });
});
