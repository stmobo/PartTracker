var dbAPI = require('api/db.js');
var User = require('api/models/User.js');
var Activity = require('api/models/Activity.js');

var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;

var chai = require('chai');
chai.use(require('chai-datetime'));
chai.use(require('chai-as-promised'));
should = chai.should();

var common = require('test/support/model_common.js');

describe('Activity', function () {
    afterEach(async function() {
        return dbAPI.activities.remove({});
    });

    describe('#title()', function () {
        common.string_prop_tests(dbAPI.activities, Activity, 'title');
    });

    describe('#description()', function () {
        common.string_prop_tests(dbAPI.activities, Activity, 'description');
    });

    describe('#maxHours()', function () {
        common.numeric_prop_tests(dbAPI.activities, Activity, 'maxHours');

        it('should reject negative values', async function () {
            var instance = new Activity();
            return instance.maxHours(-1).should.be.rejected;
        });

        it('should reject a value of 0', async function () {
            var instance = new Activity();
            return instance.maxHours(0).should.be.rejected;
        });
    });

    describe('#startTime()', function () {
        common.date_prop_tests(dbAPI.activities, Activity, 'startTime');
    });

    describe('#endTime()', function () {
        common.date_prop_tests(dbAPI.activities, Activity, 'endTime');
    });

    describe('#summary()', function () {
        common.summary_tests(dbAPI.activities, Activity, {
            title: 'test',
            description: 'test',
            maxHours: 10,
            startTime: new Date(),
            endTime: new Date(),
        });
    })

});
