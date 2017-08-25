var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var dbAPI = require('api/db.js');

var Item = function (id) {
    dbAPI.DatabaseItem.call(this, dbAPI.inventory, id);
};

Item.prototype = Object.create(dbAPI.DatabaseItem.prototype);
Item.prototype.constructor = Item;

Item.prototype.delete = function () {
    /* Remove Reservations referencing this item */
    return dbAPI.reservations.remove({part: this.id()}).then(
        /* Now remove this item */
        () => { return dbAPI.inventory.remove({_id: this.id()}); }
    );
};

/* Get / Set item name and total inventory count... */
Item.prototype.name = function(v) { return this.prop('name', v); };
Item.prototype.count = function(v) {
    if(typeof v === 'string' && !isNaN(parseInt(v))) {
        return this.prop('count', parseInt(v));
    } else if(typeof v === 'number') {
        return this.prop('count', v);
    } else if(v === undefined) {
        return this.prop('count');
    } else {
        throw new Error("Invalid parameter for Item Count!");
    }
};

/* Get number of reserved units for this item */
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

/* Get number of available units for this item */
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
    return this.fetch().then(
        () => {
            return Promise.all([
                this.name(),
                this.count(),
                this.reserved(),
                this.created(),
                this.updated(),
            ]);
        }
    ).then(
        (retn) => {
            return {
                id: this.id(),
                name: retn[0],
                count: retn[1],
                reserved: retn[2],
                available: retn[1] - retn[2],
                created: retn[3],
                updated: retn[4]
            };
        }
    );
};

Item.prototype.reservations = function () {
    return dbAPI.reservations.find({part: this.id()}, {}).then(
        (docs) => {
            return docs.map((doc) => { return doc._id; });
        }
    );
};

module.exports = Item;
