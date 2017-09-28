var dbAPI = require('api/db.js');
var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

describe('DatabaseItem', function() {
    var testCollection = dbAPI.conn.get('testCollection');

    // just constants for testing, the actual values aren't important
    var testPropKey = 'key';
    var testPropValue = 42;
    var testPropChangedValue = 'batman';

    afterEach(function() {
        /* Clear out the collection. */
        testCollection.remove({});
    });

    after(function() {
        testCollection.drop();
    });

    describe('#id()', function() {
        it('should return a MongoDB ObjectID', function() {
            var newDBItem = new dbAPI.DatabaseItem(testCollection);

            /* because .a('ObjectID') doesn't work */
            newDBItem.id().should.satisfy(x => x instanceof ObjectID);
        });

        it('should return an ObjectID if the DatabaseItem was constructed with a String ID', function() {
            var anID = monk.id();
            var newDBItem = new dbAPI.DatabaseItem(testCollection, anID.toString());

            (newDBItem.id().equals(anID)).should.equal(true);
        });
    });

    describe('#prop()', function() {
        it('should return a Promise', function() {
            var newDBItem = new dbAPI.DatabaseItem(testCollection);

            newDBItem.prop(testPropKey).should.be.a('promise');
        });

        it('should be able to set and get properties with String keys', async function() {
            var newDBItem = new dbAPI.DatabaseItem(testCollection);

            await newDBItem.prop(testPropKey, testPropValue);
            return newDBItem.prop(testPropKey).should.become(testPropValue);
        });

        it("should retrieve properties that haven't been fetched", async function() {
            var actualDoc = await testCollection.insert({ [testPropKey]: testPropValue });
            var newDBItem = new dbAPI.DatabaseItem(testCollection, actualDoc._id);

            return newDBItem.prop(testPropKey).should.become(testPropValue);
        });

        it("should not change the properties 'updated' or 'created'", function() {
            var newDBItem = new dbAPI.DatabaseItem(testCollection);

            newDBItem.prop('updated', testPropValue);
            newDBItem.prop('created', testPropValue);

            return Promise.all([
                newDBItem.prop('updated').should.become(null),
                newDBItem.prop('created').should.become(null)
            ]);
        });
    });

    describe('#save()', function() {
        it('should update existing DB document properties if corresponding documents already exist', async function() {
            var actualDoc = await testCollection.insert({ [testPropKey]: testPropValue });
            var newDBItem = new dbAPI.DatabaseItem(testCollection, actualDoc._id);

            await newDBItem.prop(testPropKey, testPropChangedValue);
            await newDBItem.save();

            var updatedDoc = await testCollection.findOne({ _id: actualDoc._id });
            updatedDoc.should.have.property(testPropKey, testPropChangedValue);
        });

        it('should create new DB documents if no corresponding ones exist', async function() {
            var newDBItem = new dbAPI.DatabaseItem(testCollection);

            await newDBItem.prop(testPropKey, testPropValue);
            await newDBItem.save();

            var createdDoc = await testCollection.findOne({ _id: newDBItem.id() });
            should.not.equal(createdDoc, null);
            createdDoc.should.have.property(testPropKey, testPropValue);
        });
    });

    describe('#fetch()', function() {
        it('should retrieve the latest property values from the database', async function() {
            var newDBItem = new dbAPI.DatabaseItem(testCollection);
            await newDBItem.prop(testPropKey, testPropValue);
            await newDBItem.save();

            await testCollection.update(
                { _id: newDBItem.id() },
                { $set: { [testPropKey]: testPropChangedValue } }
            );

            await newDBItem.fetch();
            return newDBItem.prop(testPropKey).should.become(testPropChangedValue);
        });
    });

    describe('#exists()', function() {
        it('should resolve to false if a corresponding document does not exist', async function() {
            var newDBItem = new dbAPI.DatabaseItem(testCollection);
            return newDBItem.exists().should.become(false);
        });

        it('should resolve to true if a corresponding document does exist', async function() {
            var actualDoc = await testCollection.insert({ [testPropKey]: testPropValue });
            var newDBItem = new dbAPI.DatabaseItem(testCollection, actualDoc._id);

            return newDBItem.exists().should.become(true);
        });
    });

    describe('#delete()', function() {
        it('should remove the corresponding document from the database', async function() {
            var actualDoc = await testCollection.insert({ [testPropKey]: testPropValue });
            var newDBItem = new dbAPI.DatabaseItem(testCollection, actualDoc._id);
            await newDBItem.delete();

            return testCollection.findOne({ _id: newDBItem.id() }).should.eventually.become(null);
        });
    });

    describe('#updated()', function() {
        it('should be initialized on the first call to save()', async function() {
            var newDBItem = new dbAPI.DatabaseItem(testCollection);

            newDBItem.updated().should.become(null);
            await newDBItem.save();
            return newDBItem.updated().should.eventually.be.a('date');
        });

        it('should be changed every time the DatabaseItem is saved', async function() {
            var newDBItem = new dbAPI.DatabaseItem(testCollection);
            await newDBItem.save();

            var oldUpdatedTime = await newDBItem.updated();

            await newDBItem.save();
            await newDBItem.fetch();

            return newDBItem.updated().should.not.become(oldUpdatedTime);
        });
    });

    describe('#created()', function() {
        it('should be initialized on the first call to save()', async function() {
            var newDBItem = new dbAPI.DatabaseItem(testCollection);

            newDBItem.created().should.become(null);
            await newDBItem.save();
            return newDBItem.created().should.eventually.be.a('date');
        });

        it('should stay the same every time the DatabaseItem is saved', async function() {
            var newDBItem = new dbAPI.DatabaseItem(testCollection);
            await newDBItem.save();

            var oldCreatedTime = await newDBItem.created();

            await newDBItem.save();
            await newDBItem.fetch();

            return newDBItem.created().should.become(oldCreatedTime);
        });
    });
});
