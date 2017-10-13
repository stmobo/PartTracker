var dbAPI = require('api/db.js');
var User = require('api/models/User.js');

var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;

var chai = require('chai');
chai.use(require('chai-as-promised'));
should = chai.should();

var common = require('test/support/model_common.js');

describe('Model: User', function () {
    afterEach(function() {
        /* Completely clear Inventory collection. */
        dbAPI.users.remove({});
    });

    describe('#username()', function () {
        common.string_prop_tests(dbAPI.users, User, 'username');
    });

    describe('#realname()', function () {
        common.string_prop_tests(dbAPI.users, User, 'realname');
    });

    describe('#admin()', function () {
        common.boolean_prop_tests(dbAPI.users, User, 'admin');
    });

    describe('#disabled()', function () {
        common.boolean_prop_tests(dbAPI.users, User, 'disabled');
    });

    describe('#activityCreator()', function () {
        common.boolean_prop_tests(dbAPI.users, User, 'activityCreator');
    });

    describe('#attendanceEditor()', function () {
        common.boolean_prop_tests(dbAPI.users, User, 'attendanceEditor');
    });

    describe('#inventoryEditor()', function () {
        common.boolean_prop_tests(dbAPI.users, User, 'inventoryEditor');
    });

    describe('#requestEditor()', function () {
        common.boolean_prop_tests(dbAPI.users, User, 'requestEditor');
    });

    describe('#computePasswordHash()', function () {
        it('should return a Buffer', async function () {
            var instance = new User();
            var output = instance.computePasswordHash('foobar');

            return output.should.eventually.satisfy(x => x instanceof Buffer);
        });

        it('should produce different output for different users (potentially with the same password)', async function () {
            var instanceA = new User();
            var instanceB = new User();

            var outputA = await instanceA.computePasswordHash('foobar');
            var outputB = await instanceB.computePasswordHash('foobar');

            outputA.should.not.satisfy(x => outputB.equals(x));
        });

        it('should produce different output for different passwords', async function () {
            var instance = new User();
            var outputA = await instance.computePasswordHash('foobar');
            var outputB = await instance.computePasswordHash('barfoo');

            outputA.should.not.satisfy(x => outputB.equals(x));
        });

        it('should produce the same output across database save/load (with the same password)', async function () {
            var instanceA = new User();
            var outputA = await instanceA.computePasswordHash('foobar');
            await instanceA.save();

            var instanceB = new User(instanceA.id());
            var outputB = await instanceB.computePasswordHash('foobar');

            outputA.should.satisfy(x => outputB.equals(x));
        });
    });

    describe('#setPassword()', function () {
        it('should accept a String and fulfill with no value', async function () {
            var instance = new User();
            return instance.setPassword('foobar').should.become(undefined);
        });

        it('should reject non-string values', async function () {
            var instance = new User();
            return Promise.all([
                instance.setPassword(42).should.be.rejected,
                instance.setPassword([]).should.be.rejected,
                instance.setPassword().should.be.rejected,
            ]);
        });
    });

    describe('#validatePassword()', function () {
        it('should return true when passed a previously-set password', async function () {
            var instanceA = new User();
            await instanceA.setPassword('foobar');
            await instanceA.save();

            var instanceB = new User(instanceA.id());
            return instanceB.validatePassword('foobar').should.become(true);
        });

        it('should return false when passed an incorrect password string', async function () {
            var instanceA = new User();
            await instanceA.setPassword('foobar');
            await instanceA.save();

            var instanceB = new User(instanceA.id());
            return instanceB.validatePassword('barfoo').should.become(false);
        });

        it('should reject non-string values', async function () {
            var instance = new User();
            await instance.setPassword('foobar');

            return Promise.all([
                instance.validatePassword(42).should.be.rejected,
                instance.validatePassword([]).should.be.rejected,
                instance.validatePassword().should.be.rejected,
            ]);
        });
    });

    describe('#summary()', function () {
        common.summary_tests(dbAPI.users, User, {
            realname: 'Foo Bar',
            username: 'foobar',
            admin: true,
            activityCreator: true,
            attendanceEditor: true,
            inventoryEditor: true,
            requestEditor: true,
            disabled: false,
        });
    });
});
