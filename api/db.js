var monk = require('monk');

const conn = monk('localhost:27017/partstracker');
const users = conn.get('users');
const inventory = conn.get('inventory');
const reservations = conn.get('reservations');
const requests = conn.get('requests');
const assemblies = conn.get('assemblies');
const assembly_links = conn.get('assembly_links');

reservations.ensureIndex( {part: 1} );

var DatabaseItem = function(database, id) {
    this.db = database;
    if(id === undefined) {
        this._id = monk.id();
    } else {
        this._id = id;
    }
}

/* Returns this item's ObjectID. */
DatabaseItem.prototype.id = function () {
    return monk.id(this._id);
};

/* Get or set a property. */
DatabaseItem.prototype.prop = function (k, v) {
    if(k === 'updated' || k === 'created') {
        v = undefined;
    }

    if(v === undefined) {
        /* Get name */
        if(this['_'+k] === undefined) {
            return this.db.findOne({_id: this.id()}).then(
                (doc) => {
                    if(doc === null) {
                        return null;
                    } else {
                        this['_'+k] = doc[k];
                        return doc[k];
                    }
                }
            );
        } else {
            return Promise.resolve(this['_'+k]);
        }
    } else {
        /* Set name */
        this['_'+k] = v;
    }
};

DatabaseItem.prototype.updated = function () { return this.prop('updated'); };
DatabaseItem.prototype.created = function () { return this.prop('created'); };

/* Check to see if this item exists in the database. */
DatabaseItem.prototype.exists = function () {
    return this.db.count({_id: this.id()}).then(
        (count) => {
            return (count > 0);
        }
    );
};

/* Update the DatabaseItem with information from the database. */
DatabaseItem.prototype.fetch = function () {
    return this.db.findOne({_id: this.id()}).then(
        (doc) => {
            if(doc === null) {
                return this; // no updates
            } else {
                for(var prop in doc) {
                    if(doc.hasOwnProperty(prop) && prop !== '_id') {
                        this['_'+prop] = doc[prop];
                    }
                }

                return this;
            }
        }
    );
};

/* Update the database with information from this object. */
DatabaseItem.prototype.save = function () {
    return this.db.count({_id: this.id()}).then(
        (n) => {
            spec = { _id: this.id() };
            for(var prop in this) {
                if(this.hasOwnProperty(prop) &&
                    prop !== '_id' &&
                    prop !== '_updated' &&
                    prop !== '_created' &&
                    prop.charAt(0) === '_') {
                    spec[prop.substr(1)] = this[prop];
                }
            }

            /* Set last updated time */
            spec.updated = new Date();

            if(n == 0) {
                /* Insert this as a new document: */
                spec.created = new Date();
                return this.db.insert(spec);
            } else {
                /* Update the existing document: */
                return this.db.update(
                    { _id: this.id() },
                    { $set: spec }
                );
            }
        }
    ).then( () => { return this; } );
};

DatabaseItem.prototype.delete = function () {
    return this.db.remove({_id: this.id()});
};

module.exports = {
    conn: conn,
    users: users,
    inventory: inventory,
    reservations: reservations,
    requests: requests,
    assemblies: assemblies,
    assembly_links: assembly_links,
    DatabaseItem: DatabaseItem
};
