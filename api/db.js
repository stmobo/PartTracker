var monk = require('monk');
var winston = require('winston');
var args = require('minimist')(process.argv.slice(2));

const dbLocation = `${args.db_host || 'localhost'}:${args.db_port || 27017}/partstracker`;

/* Database collections are also exported under the appropriate names. */
module.exports = {
    DatabaseItem: DatabaseItem
};

/* This function is mostly intended for testing purposes.
 * It should not be called when DatabaseItem (subclass) objects are in use
 * (i.e. don't call this from middleware)
 */
async function reset_database_connection(newLocation) {
    /* Close the old connection, if necessary */
    if(module.exports.conn) {
        await module.exports.conn.close();
    }

    const conn = monk(newLocation);

    module.exports.conn = conn;
    module.exports.users = conn.get('users');
    module.exports.inventory = conn.get('inventory');
    module.exports.reservations = conn.get('reservations');
    module.exports.activities = conn.get('activities');
    module.exports.requests = conn.get('requests');

    module.exports.reservations.ensureIndex( {part: 1} );
}

/* Open the initial connection. */
reset_database_connection(dbLocation);

function DatabaseItem(database, id) {
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
                winston.log('info', 'Added new object %s to %s collection.',
                    this.id().toString(), this.db.name,
                    {
                        id: this.id().toString(),
                        collection: this.db.name,
                        object: JSON.stringify(spec)
                    }
                );

                return this.db.insert(spec);
            } else {
                /* Update the existing document: */
                winston.log('info', 'Updated object %s in %s collection.',
                    this.id().toString(), this.db.name,
                    {
                        id: this.id().toString(),
                        collection: this.db.name,
                        spec: JSON.stringify(spec)
                    }
                );

                return this.db.update(
                    { _id: this.id() },
                    { $set: spec }
                );
            }
        }
    ).then( () => { return this; } );
};

DatabaseItem.prototype.delete = async function () {
    winston.log('info', 'Deleted object %s from %s collection.',
        this.id().toString(), this.db.name,
        {
            id: this.id().toString(),
            collection: this.db.name
        }
    );
    return this.db.remove({_id: this.id()});
};
