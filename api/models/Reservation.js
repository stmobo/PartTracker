var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var dbAPI = require('api/db.js');
var Item = require('api/models/Item.js');
var User = require('api/models/User.js');

var Reservation = function(id) {
    dbAPI.DatabaseItem.call(this, dbAPI.reservations, id);
};

Reservation.prototype = Object.create(dbAPI.DatabaseItem.prototype);
Reservation.prototype.constructor = Reservation;

Reservation.prototype.count = function(v) { return this.prop('count', v); };

Reservation.prototype.requester = function(v) {
    if(v === undefined) {
        return this.prop('requester').then(
            (userID) => {
                if(userID === null) return null;
                return new User(userID);
            }
        );
    } else {
        if(v instanceof User) {
            return this.prop('requester', v.id());
        } else if((v instanceof ObjectID) || (typeof v === 'string')) {
            return this.prop('requester', monk.id(v));
        } else {
            throw new Error("Invalid UserID passed to setter!");
        }
    }
};

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
