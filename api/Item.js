var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var dbAPI = require('api/db.js');

function Item(id, count) {
    if(id instanceof ObjectID) {
        /* Load an item from the DB */
        dbAPI.DatabaseItem.call(this, dbAPI.inventory, id);
    } else {
        dbAPI.DatabaseItem.call(this, dbAPI.inventory);

        if(typeof id === 'string') {
            /* id is the name of a new Item type */
            this._name = id;
            this._count = count;
        } else {
            /* Create a new empty item type */
            this._name = "";
            this._count = 0;
        }
    }
};
Item.prototype = Object.create(dbAPI.DatabaseItem);
Item.prototype.constructor = Item;


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

Item.prototype.json = function () {
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
    ).then(JSON.stringify);
};

module.exports = Item;
