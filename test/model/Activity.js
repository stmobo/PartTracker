var dbAPI = require('api/db.js');
var User = require('api/models/User.js');
var Activity = require('api/models/Activity.js');

var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;

var chai = require('chai');
chai.use(require('chai-as-promised'));
should = chai.should();

var common = require('test/support/model_common.js');

describe('Model: Activity', function () {
    afterEach(async function() {
        return Promise.all([
            dbAPI.users.remove({}),
            dbAPI.activities.remove({}),
        ]);
    });

    describe('#title()', function () {
        common.string_prop_tests(dbAPI.activities, Activity, 'title');
    });

    describe('#description()', function () {
        common.string_prop_tests(dbAPI.activities, Activity, 'description');
    });

    describe('#maxHours()', function () {
        common.numeric_prop_tests(dbAPI.activities, Activity, 'maxHours');

        it('should accept decimal values from the database', async function () {
            var doc = await dbAPI.activities.insert({ maxHours: 4.2 });
            var instance = new Activity(doc._id);

            // or alternately, test .should.become(param.toString())
            return instance.maxHours().should.become(4.2);
        });

        it('should accept decimal values as property values', async function () {
            var instanceA = new Activity();
            await instanceA.maxHours(4.2);
            await instanceA.save();

            var instanceB = new Activity(instanceA.id());
            return instanceB.maxHours().should.become(4.2);
        });

        it('should reject negative values', async function () {
            var instance = new Activity();
            return instance.maxHours(-1).should.be.rejected;
        });

        it('should reject a value of 0', async function () {
            var instance = new Activity();
            return instance.maxHours(0).should.be.rejected;
        });
    });

    describe('#userHours()', function () {
        it('should return a Promise for get calls', function() {
            var instance = new Activity();

            var get_promise = instance.userHours();
            should.exist(get_promise);
            get_promise.should.be.a('promise');
            return get_promise.should.be.fulfilled;
        });

        it('should return a Promise for set calls', function() {
            var instance = new Activity();

            var set_promise = instance.userHours([]);
            should.exist(set_promise);
            set_promise.should.be.a('promise');
            return set_promise.should.be.fulfilled;
        });

        it('should return an Array of objects', async function () {
            var doc = await dbAPI.activities.insert({ userHours: [ {user: monk.id(), hours: 10, checkIn: new Date() } ] });
            var instance = new Activity(doc._id);

            var userHours = await instance.userHours();
            userHours.should.be.a('array');
            userHours.should.have.lengthOf(1);

            userHours[0].should.be.a('object');
        });

        it("should return objects with 'user', 'hours', and 'checkIn' properties", async function () {
            var test_checkin = {user: monk.id(), hours: 1, checkIn: new Date() };
            var raw_checkin_time = test_checkin.checkIn.getTime();

            var doc = await dbAPI.activities.insert({ userHours: [ test_checkin ] });
            var instance = new Activity(doc._id);

            var userHours = await instance.userHours();
            userHours[0].should.have.own.property('user');
            userHours[0].should.have.own.property('hours');
            userHours[0].should.have.own.property('checkIn');

            userHours[0].user.should.satisfy(x => test_checkin.user.equals(x));
            userHours[0].hours.should.equal(test_checkin.hours);
            userHours[0].checkIn.getTime().should.be.within(raw_checkin_time-10000, raw_checkin_time+10000);
        });

        it("should return an empty Array if the document or property does not exist", async function () {
            var instance = new Activity();
            return Promise.all([
                instance.userHours().should.eventually.be.a('array'),
                instance.userHours().should.eventually.have.lengthOf(0),
            ]);
        });

        it("should accept Arrays of objects with 'user', 'hours', and 'checkIn' properties", async function () {
            var checkinDate = new Date();
            var checkinUser = await User.generate();
            var instance = await Activity.generate();

            var test_checkins = [ {user: checkinUser.id(), hours: 1, checkIn: checkinDate } ];

            await instance.userHours(test_checkins);
            await instance.save();

            instance = new Activity(instance.id());

            var retrieved_checkins = await instance.userHours();
            var raw_checkin_time = checkinDate.getTime();

            retrieved_checkins.should.have.lengthOf(1);
            retrieved_checkins[0].user.should.satisfy(x => test_checkins[0].user.equals(x));
            retrieved_checkins[0].hours.should.equal(test_checkins[0].hours);
            retrieved_checkins[0].checkIn.getTime().should.be.within(raw_checkin_time-10000, raw_checkin_time+10000);
        });

        it("should reject non-Array values", async function () {
            var instance = await Activity.generate();

            return Promise.all([
                instance.userHours('foobar').should.be.rejected,
                instance.userHours(42).should.be.rejected,
                instance.userHours(monk.id()).should.be.rejected,
                instance.userHours(function() {}).should.be.rejected,
            ]);
        });

        it("should reject Arrays with invalid elements", async function () {
            var instance = await Activity.generate();
            return instance.userHours([ {user: monk.id(), foo: 42} ]).should.be.rejected;
        });


        it("should reject check-ins with check in times outside of the Activity start/end times", async function () {
            var checkinDate = new Date();
            var checkinUser = await User.generate();
            var instance = await Activity.generate();
            await Promise.all([
                instance.startTime(new Date(Date.now() - 3600*1000)),
                instance.endTime(new Date(Date.now() + 3600*1000)),
            ]);

            await instance.save();

            var early_checkin = [ {user: checkinUser.id(), hours: 1, checkIn: new Date(Date.now() - 3600*2000)} ];
            var late_checkin = [ {user: checkinUser.id(), hours: 1, checkIn: new Date(Date.now() + 3600*2000)} ];

            return Promise.all([
                instance.userHours(early_checkin).should.be.rejected,
                instance.userHours(late_checkin).should.be.rejected,
            ]);
        });

        it("should reject check-ins that log too many hours for the Activity", async function () {
            var checkinUser = await User.generate();
            var instance = await Activity.generate();

            return instance.userHours([
                { user: checkinUser.id(), hours:9999999, checkIn: new Date() }
            ]).should.be.rejected;
        });

        it("should reject check-ins that log negative hours for the Activity", async function () {
            var checkinUser = await User.generate();
            var instance = await Activity.generate();

            return instance.userHours([
                { user: checkinUser.id(), hours:-1, checkIn: new Date() }
            ]).should.be.rejected;
        });

        it("should reject check-ins for nonexistent Users", async function () {
            var instance = await Activity.generate();

            return instance.userHours([
                { user:  monk.id(), hours:1, checkIn: new Date() }
            ]).should.be.rejected;
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

        it("should return a valid representation for userHours()", async function () {
            var checkinUser = await User.generate();
            var instance = await Activity.generate();

            var checkInDate = new Date();
            var testCheckIn = {user: checkinUser.id(), hours: 1, checkIn: checkInDate };
            await instance.userHours([testCheckIn]);
            await instance.save();

            instance = new Activity(instance.id());
            var summary = await instance.summary();

            summary.should.have.own.property('userHours');
            summary.userHours.should.be.a('array');
            summary.userHours.should.have.lengthOf(1);

            summary.userHours[0].user.should.satisfy(x => monk.id(x).equals(checkinUser.id()));
            summary.userHours[0].hours.should.equal(testCheckIn.hours);
            summary.userHours[0].checkIn.getTime().should.be.within(checkInDate.getTime()-5000, checkInDate.getTime()+5000);
        });
    });

});
