var monk = require('monk');
var dbAPI = require('api/db.js');
var Item = require('api/Item.js');

function Reservation(id, part, count, requester) {
    if((id instanceof ObjectID) || (typeof id === 'string')) {
        /* Load an item from the DB */
        dbAPI.DatabaseItem.call(this, dbAPI.reservations, id);
    } else {
        dbAPI.DatabaseItem.call(this, dbAPI.reservations);
    }

    if(part instanceof Item) {
        this._part = part.id();
    } else if((part instanceof ObjectID) || (typeof part === 'string')) {
        this._part = monk.id(part);
    } else {
        this._part = null;
    }

    this._requester = requester;
    this._count = count;

};
Reservation.prototype = Object.create(dbAPI.DatabaseItem);
Reservation.prototype.constructor = Reservation;

Reservation.prototype.count = function(v) { return this.prop('count', v); };
Reservation.prototype.requester = function(v) { return this.prop('requester', v); };
Reservation.prototype.part = function(v) {
    if(v === undefined) {
        /* Get part object. */
        return this.prop('part').then(
            (partID) => {
                if(partID !== null) {
                    return null;
                }

                return new Item(partID);
            }
        );
    } else {
        return this.prop('part', v);
    }
};

Reservation.prototype.summary = function () {
    return Promise.all([
        this.prop('part'),
        this.count(),
        this.requester(),
    ]).then(
        (retn) => {
            return {
                id: this.id(),
                part: retn[0],
                count: retn[1]
                requester: retn[2]
            };
        }
    );
};

module.exports = Reservation;
