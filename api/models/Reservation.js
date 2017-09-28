var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var type = require('type-detect');

var dbAPI = require('api/db.js');
var Item = require('api/models/Item.js');
var User = require('api/models/User.js');

var Reservation = function(id) {
    dbAPI.DatabaseItem.call(this, dbAPI.reservations, id);
};

Reservation.prototype = Object.create(dbAPI.DatabaseItem.prototype);
Reservation.prototype.constructor = Reservation;

Reservation.prototype.count = async function(v) {
    if(v !== undefined) {
        if(typeof v === 'string' && !isNaN(parseInt(v, 10))) {
            v = parseInt(v, 10);
        } else if(typeof v !== 'number') {
            throw new Error("Parameter to count() must be a number or a numerical string!");
        }

        return this.prop('count', v);
    } else {
        var t = await this.prop('count');
        if(typeof t === 'string' && !isNaN(parseInt(t, 10))) {
            return parseInt(t, 10);
        } else if(typeof t === 'number' || t === null) {
            return t;
        }

        throw new Error("Got non-numerical, non-null value for count() from database!");
    }
};

Reservation.prototype.requester = async function(v) {
    if(v === undefined) {
        var userID = await this.prop('requester');
        if(userID === null) return null;
        return new User(userID);
    } else {
        if(v instanceof User) {
            return this.prop('requester', v.id());
        } else if((v instanceof ObjectID) || (type(v) === 'string')) {
            return this.prop('requester', monk.id(v));
        } else {
            throw new Error("Invalid UserID passed to setter!");
        }
    }
};

Reservation.prototype.part = async function(v) {
    if(v === undefined) {
        /* Get part object. */
        var partID = await this.prop('part');
        if(partID === null) return null;
        return new Item(partID);
    } else {
        if(v instanceof Item) {
            return this.prop('part', v.id());
        } else if((v instanceof ObjectID) || (type(v) === 'string')) {
            return this.prop('part', monk.id(v));
        } else {
            throw new Error("Invalid PartID passed to setter!");
        }
    }
};

Reservation.prototype.summary = function () {
    return this.fetch().then(
        () => {
            return Promise.all([
                this.prop('part'),
                this.count(),
                this.requester().then( (user) => user.summary() ),
                this.created(),
                this.updated(),
            ]);
        }
    ).then(
        (retn) => {
            return {
                id: this.id(),
                part: retn[0],
                count: retn[1],
                requester: retn[2],
                created: retn[3],
                updated: retn[4],
            };
        }
    );
};

module.exports = Reservation;
