var monk = require('monk');
var dbAPI = require('api/db.js');
var Reservation = require('api/Reservation.js');    // yes I know this is a circular ref

function Item(id, count) {
    if(id instanceof ObjectID) {
        /* Load an item from the DB */
        dbAPI.DatabaseItem.call(this, dbAPI.inventory, id);
    } else {
        dbAPI.DatabaseItem.call(this, dbAPI.inventory);

        if(typeof id === 'string') {
            /* id is the name of a new Item type */
            this._name = id;
        } else {
            /* Create a new empty item type */
            this._name = "";
        }

        c = parseInt(count);
        if(c === c) { // count is not NaN
            this._count = c;
        } else {
            this._count = 0;
        }
    }
};
Item.prototype = Object.create(dbAPI.DatabaseItem);
Item.prototype.constructor = Item;

Item.prototype.delete = function () {
    return dbAPI.reservations.remove({part: this.id()}).then(
        () => {
            return dbAPI.inventory.remove({_id: this.id()});
        }
    );
};

Item.prototype.name = function(v) { return this.prop('name', v); };
Item.prototype.count = function(v) { return this.prop('count', v); };

Item.prototype.reserved = function () {
    return dbAPI.reservations.aggregate([
        { $match: { part: this.id() } },
        { $group: { _id: null, reserved: { $sum: "$count" } } }
    ]).then(
        (doc) => {
            if(doc[0] === undefined) {
                return 0;
            }

            ret = parseInt(doc[0].reserved);
            if(ret !== ret) {
                return 0;
            } else {
                return ret;
            }
        }
    );
};

Item.prototype.available = function () {
    return Promise.all([
        this.count(),
        this.reserved()
    ]).then(
        (retn) => {
            return retn[0] - retn[1];
        }
    );
};

Item.prototype.summary = function () {
    return Promise.all([
        this.name(),
        this.count(),
        this.reserved()
    ]).then(
        (retn) => {
            return {
                id: this.id(),
                name: retn[0],
                count: retn[1],
                reserved: retn[2],
                available: retn[1] - retn[2]
            };
        }
    );
};

Item.prototype.reservations = function () {
    return dbAPI.reservations.find({part: this.id()}, {}).then(
        (docs) => {
            return docs.map((doc) => { return new Reservation(doc._id); });
        }
    );
};

module.exports = Item;
