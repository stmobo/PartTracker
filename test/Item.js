var dbAPI = require('api/db.js');
var Item = require('api/Models/Item.js');

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

describe.skip('Item', function() {
    afterEach(function() {
        /* Completely clear Inventory collection. */
        dbAPI.inventory.remove({});
    });

    describe('#count()', function() {
        it('should be able to save and load numbers', async function() {
            var testItem = new Item();
            // choice of number shouldn't matter; maybe replace with some kind of random number?
            var testCount = 42;

            await testItem.count(testCount);
            await testItem.save();

            var otherTestItem = new Item(testItem.id());
            return otherTestItem.count().should.eventually.equal(testCount);
        });

        it('should be able to save a numerical string and load a number', async function() {
            var testItem = new Item();
            var testCount = '42';

            await testItem.count(testCount);
            await testItem.save();

            var otherTestItem = new Item(testItem.id());
            return otherTestItem.count().should.eventually.equal(parseInt(testCount, 10));
        });

        it('should reject non-numerical strings', async function() {
            var testItem = new Item();
            var testString = 'batman';

            return testItem.count(testString).should.be.rejectedWith(Error);
        });
    });

    describe('#name()', function() {
        it('should be able to save and load strings', async function() {
            var testItem = new Item();
            var testString = 'Foobar';

            await testItem.name(testString);
            await testItem.save();

            var otherTestItem = new Item(testItem.id());
            return otherTestItem.name().should.eventually.equal(testString);
        });
    });

    describe('#summary()', function() {
        it("should return an object with all of an item's saved properties", async function() {
            var testItem = new Item();
        });
    })
});
