var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var dbAPI = require('api/db.js');
var Item = require('api/models/Item.js');

var Reservation = function(id) {
    if((id instanceof ObjectID) || (typeof id === 'string')) {
        /* Load an item from the DB */
        dbAPI.DatabaseItem.call(this, dbAPI.reservations, id);
    } else {
        dbAPI.DatabaseItem.call(this, dbAPI.reservations);
    }
};

Reservation.prototype = Object.create(dbAPI.DatabaseItem.prototype);
Reservation.prototype.constructor = Reservation;

Reservation.prototype.delete = function () {
    return dbAPI.reservations.remove({_id: this.id()});
};

Reservation.prototype.count = function(v) { return this.prop('count', v); };
Reservation.prototype.requester = function(v) { return this.prop('requester', v); };
Reservation.prototype.part = function(v) {
    if(v === undefined) {
        /* Get part object. */
        return this.prop('part').then(
            (partID) => {
                if(partID === null) {
                    return null;
                }

                return new Item(partID);
            }
        );
    } else {
        if(v instanceof Item) {
            return this.prop('part', v.id());
        } else if((v instanceof ObjectID) || (typeof v === 'string')) {
            return this.prop('part', monk.id(v));
        } else {
            throw new Error("Invalid PartID passed to setter!");
        }
    }
};

Reservation.prototype.asm = function(v) {
    if(v === undefined) {
        return this.prop('asm');
    } else {
        if((v instanceof ObjectID) || (typeof v === 'string')) {
            return this.prop('asm', monk.id(v));
        } else {
            throw new Error("Invalid AssemblyID passed to setter!");
        }
    }
}

Reservation.prototype.summary = function () {
    return this.fetch().then(
        () => {
            return Promise.all([
                this.prop('part'),
                this.count(),
                this.requester(),
                this.created(),
                this.updated(),
                this.asm(),
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
                assembly: retn[5],
            };
        }
    );
};

module.exports = Reservation;
