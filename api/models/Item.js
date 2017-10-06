var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var dbAPI = require('api/db.js');
var winston = require('winston');
var type = require('type-detect');

var Item = function (id) {
    dbAPI.DatabaseItem.call(this, dbAPI.inventory, id);
};

Item.prototype = Object.create(dbAPI.DatabaseItem.prototype);
Item.prototype.constructor = Item;

Item.prototype.delete = async function () {
    /* Remove Reservations referencing this item */
    winston.log('info', 'Deleted object %s from %s collection.',
        this.id().toString(), this.db.name,
        {
            id: this.id().toString(),
            collection: this.db.name
        }
    );

    return dbAPI.reservations.remove({part: this.id()}).then(
        /* Now remove this item */
        () => { return dbAPI.inventory.remove({_id: this.id()}); }
    );
};

/* Get / Set item name and total inventory count... */
Item.prototype.name = async function(v) {
    if(type(v) === 'string') {
        return this.prop('name', v);
    } else if(v === undefined) {
        var t = await this.prop('name');
        if(t === null || type(t) === 'string') return t;

        throw new Error("Got non-string value for Item.name() from database!");
    } else {
        throw new Error("Item.name() value must be a string!");
    }
};

Item.prototype.count = async function(v) {
    if(type(v) === 'string' && !isNaN(parseInt(v, 10))) {
        return this.prop('count', parseInt(v, 10));
    } else if(type(v) === 'number') {
        return this.prop('count', v);
    } else if(v === undefined) {
        var t = await this.prop('count');

        if(t === null || type(t) === 'number') return t;
        else if(type(t) === 'string' && !isNaN(parseInt(t, 10))) return parseInt(t, 10);

        throw new Error("Got non-numerical, non-null value for Item.count() from database!");
    } else {
        throw new Error("Item.count() value must be a numerical value (parsable string or number)!");
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

Item.prototype.requested = async function() {
    var aggregate = await dbAPI.requests.aggregate([
        { $match: { item: this.id() } },
        { $group: { _id: null, requested: { $sum: "$count" } } }
    ]);

    if(aggregate[0] === undefined) {
        return 0;
    }

    var rval = parseInt(aggregate[0].requested);
    if(isNaN(rval)) return 0;
    return rval;
}

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

Item.prototype.summary = async function () {
    await this.fetch()

    var [name, count, reserved, requested, created, updated] = await Promise.all([
        this.name(),
        this.count(),
        this.reserved(),
        this.requested(),
        this.created(),
        this.updated(),
    ]);

    return {
        id: this.id(),
        name,
        count,
        reserved,
        requested,
        created,
        updated,
        available: count-reserved,
    };
};

Item.prototype.reservations = function () {
    return dbAPI.reservations.find({part: this.id()}, {}).then(
        (docs) => {
            return docs.map((doc) => { return doc._id; });
        }
    );
};

/* For testing purposes. */
Item.generate = async function() {
    var instance = new Item();
    await Promise.all([
        instance.count(50),
        instance.name('Name')
    ]);

    await instance.save();

    return instance;
}

module.exports = Item;
