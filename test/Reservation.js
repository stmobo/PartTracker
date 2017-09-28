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
    afterEach(function() {
        /* Completely clear Inventory and Reservation collections. */
        dbAPI.inventory.remove({});
        dbAPI.reservations.remove({});
    });

    describe('#part()', function() {
        common.model_prop_tests(dbAPI.reservations, Reservation, 'part', Item);

        it(`should cause this Reservation's ID to appear using Item.reservations()`, async function () {
            var itemInstance = new Item();
            var rsvpInstance = new Reservation();

            await rsvpInstance.part(itemInstance.id());
            await Promise.all([
                itemInstance.save(),
                rsvpInstance.save()
            ]);

            return itemInstance.reservations().should.eventually.have.lengthOf(1).and.satisfy(
                x => x[0].equals(rsvpInstance.id()) /* The list's only object has an ID matching rsvpInstance */
            );
        });
    });

    describe('#requester()', function() {
        common.model_prop_tests(dbAPI.reservations, Reservation, 'requester', User);
    });

    describe('#count()', function () {
        common.numeric_prop_tests(dbAPI.reservations, Reservation, 'count');

        it(`should increase the Item.reserved() property for associated items`, async function () {
            var itemCount = 60;
            var rsvpCount = 10;

            var itemInstance = new Item();
            var rsvpInstance = new Reservation();

            await itemInstance.count(itemCount);
            await Promise.all([
                rsvpInstance.part(itemInstance.id()),
                rsvpInstance.count(rsvpCount)
            ]);

            await Promise.all([
                itemInstance.save(),
                rsvpInstance.save()
            ]);

            return itemInstance.reserved().should.become(rsvpCount);
        });

        it(`should decrease the Item.available() property for associated items`, async function () {
            var itemCount = 60;
            var rsvpCount = 10;

            var itemInstance = new Item();
            var rsvpInstance = new Reservation();

            await itemInstance.count(itemCount);
            await Promise.all([
                rsvpInstance.part(itemInstance.id()),
                rsvpInstance.count(rsvpCount)
            ]);

            await Promise.all([
                itemInstance.save(),
                rsvpInstance.save()
            ]);

            return itemInstance.available().should.become(itemCount-rsvpCount);
        });
    });

    describe.skip('#summary()', function() {

    });
});
