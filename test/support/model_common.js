var dbAPI = require('api/db.js');

var util = require('util');
var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;

var type = require('type-detect');

var chai = require('chai');
chai.use(require('chai-as-promised'));
should = chai.should();

module.exports = {
    string_prop_tests: string_prop_tests,
    numeric_prop_tests: numeric_prop_tests,
    boolean_prop_tests: boolean_prop_tests
};

// types that shouldn't be accepted by most prop functions
const usual_rejected_test_cases = [{}, [], function() {}];

function read_write_tests(collection, Model, prop_name, params) {
    if(!(params instanceof Array)) {
        params = [params];
    }

    it(`should accept ${type(params[0])}s from the database`, function() {
        return Promise.all(params.map(async function(param) {
            var doc = await collection.insert({ [prop_name]: param });
            var instance = new Model(doc._id);

            // or alternately, test .should.become(param.toString())
            return instance[prop_name]().should.become(param);
        }));
    });

    it(`should accept ${type(params[0])}s as property values`, function() {
        return Promise.all(params.map(async function(param) {
            var instanceA = new Model();
            await instanceA[prop_name](param);
            await instanceA.save();

            var instanceB = new Model(instanceA.id());
            return instanceB[prop_name]().should.become(param);
        }));
    });
}

function rejection_tests(collection, Model, prop_name, params) {
    if(!(params instanceof Array)) {
        params = [params];
    }

    params.forEach(function(param) {
        it(`should reject ${type(param)}s as property values`, async function() {
            var instance = new Model();
            var set_promise = instance[prop_name](param);
            should.exist(set_promise)
            return set_promise.should.be.rejected;
        });
    });
}

function generic_prop_tests(Model, prop_name, accepted_value) {
    it('should return a Promise for get calls', async function() {
        var instance = new Model();

        var get_promise = instance[prop_name]();
        should.exist(get_promise);
        get_promise.should.be.a('promise');
    });

    it('should return null if the property is not set', async function() {
        var instance = new Model();
        instance[prop_name]().should.become(null);
    })

    it('should return a Promise for set calls', async function() {
        var instance = new Model();

        var set_promise = instance[prop_name](accepted_value);
        should.exist(set_promise);
        set_promise.should.be.a('promise');
    });
}

/* Common tests for model string properties */
function string_prop_tests(collection, Model, prop_name) {
    generic_prop_tests(Model, prop_name, 'test');
    read_write_tests(collection, Model, prop_name, 'test');
    rejection_tests(collection, Model, prop_name, usual_rejected_test_cases);
}

/* Common tests for model number properties */
function numeric_prop_tests(collection, Model, prop_name) {
    const numeric_string = '42';
    const nonnumeric_string = 'foobar';

    generic_prop_tests(Model, prop_name, numeric_string);
    read_write_tests(collection, Model, prop_name, 42);

    it('should accept numerical strings from the database', async function() {
        var doc = await collection.insert({ [prop_name]: numeric_string });
        var instance = new Model(doc._id);

        return instance[prop_name]().should.become(parseInt(numeric_string, 10));
    });

    it('should accept numerical strings as property values', async function() {
        var instanceA = new Model();
        await instanceA[prop_name](numeric_string);
        await instanceA.save();

        var instanceB = new Model(instanceA.id());
        return instanceB[prop_name]().should.become(parseInt(numeric_string, 10));
    });

    it('should reject non-numerical strings as property values', async function() {
        var instance = new Model();

        return instance[prop_name](nonnumeric_string).should.be.rejected;
    });

    rejection_tests(collection, Model, prop_name, usual_rejected_test_cases);
}

/* Common tests for boolean properties */
function boolean_prop_tests(collection, Model, prop_name) {
    const accepted_string_test_cases = {
        'true': true,
        'false': false,
        'TRUE': true,
        'FALSE': false,
        'TrUe': true,
        'fAlSe': false
    };

    const rejected_string_case = 'foobar';

    generic_prop_tests(Model, prop_name, true);

    it("should accept boolean values from the database", async function() {
        var docA = await collection.insert({ [prop_name]: true });
        var docB = await collection.insert({ [prop_name]: false });

        var instanceA = new Model(docA._id);
        var instanceB = new Model(docB._id);

        return Promise.all([
            instanceA[prop_name]().should.become(true),
            instanceB[prop_name]().should.become(false)
        ]);
    });

    it("should accept boolean values as property values", function() {
        return Promise.all([true, false].map(async function(param) {
            var instanceA = new Model();
            await instanceA[prop_name](param);
            await instanceA.save();

            var instanceB = new Model(instanceA.id());
            return instanceB[prop_name]().should.become(param);
        }));
    });

    it("should accept 'true' and 'false' (case-invariant) as property values", async function() {
        var promises = [];
        for(param in accepted_string_test_cases) {
            if(accepted_string_test_cases.hasOwnProperty(param)) {
                promises.push(async function() {
                    var result = accepted_string_test_cases[param];

                    var instanceA = new Model();
                    await instanceA[prop_name](param);
                    await instanceA.save();

                    var instanceB = new Model(instanceA.id());
                    return instanceB[prop_name]().should.become(result);
                }());
            }
        }

        return Promise.all(promises);
    });

    it("should reject other strings", async function() {
        var instance = new Model(doc._id);

        return instance[prop_name](rejected_string_case).should.be.rejected;
    });

    rejection_tests(collection, Model, prop_name, usual_rejected_test_cases);
}
