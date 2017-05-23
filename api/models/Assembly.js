var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var dbAPI = require('api/db.js');
var Item = require('api/models/Item.js');
var Reservation = require('api/models/Reservation.js');

function AssemblyRequirement(itemID, count, reservation) {
    this.item = itemID;
    this.count = count;
    this.reservation = reservation;
}

var Assembly = function(id) {
    if((id instanceof ObjectID) || (typeof id === 'string')) {
        dbAPI.DatabaseItem.call(this, dbAPI.assemblies, id);
    } else {
        dbAPI.DatabaseItem.call(this, dbAPI.assemblies);
        this._requirements = [];
        this._subassemblies = [];
        this._name = "";
    }
};

Assembly.prototype = Object.create(dbAPI.DatabaseItem.prototype);
Assembly.prototype.constructor = Assembly;

Assembly.prototype.delete = function () {
    /* Remove all associated reservations before deleting this object */
    return dbAPI.reservations.remove({asm: this.id()}).then(
        () => {
            return dbAPI.assemblies.remove({_id: this.id()});
        }
    );
};

/* The usual getters/setters: */
Assembly.prototype.name = function (v) { return this.prop("name", v); };
Assembly.prototype.requirements = function (v) { return this.prop("requirements", v); };
Assembly.prototype.subassemblies = function (v) { return this.prop("subassemblies", v); };

Assembly.prototype.summary = function () {
    return this.fetch().then(
        () => {
            return Promise.all([
                this.name(),
                this.requirements(),
                this.subassemblies(),
                this.updated(),
                this.created(),
            ]);
        }
    ).then(
        (retn) => {
            return {
                id: this.id(),
                name: retn[0],
                requirements: retn[1],
                subassemblies: retn[2],
                updated: retn[3],
                created: retn[4],
            };
        }
    )
};

module.exports = {
    Assembly: Assembly,
    Requirement: AssemblyRequirement,
};
