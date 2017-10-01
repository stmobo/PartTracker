var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var dbAPI = require('api/db.js');
var type = require('type-detect');

const crypto = require('crypto');

var User = function(id) {
    if((id instanceof ObjectID) || (typeof id === 'string')) {
        /* Load a user from the DB */
        dbAPI.DatabaseItem.call(this, dbAPI.users, id);
    } else {
        // make a new user
        dbAPI.DatabaseItem.call(this, dbAPI.users);

        salt = crypto.randomBytes(8);
        this['_salt'] = salt.toString();
    }
};

User.prototype = Object.create(dbAPI.DatabaseItem.prototype);
User.prototype.constructor = User;

User.prototype.delete = function () {
    return dbAPI.users.remove({_id: this.id()});
};

User.prototype.username = async function(v) {
    if(v === undefined) {
        var t = await this.prop('username');
        if(t !== null && type(t) !== 'string') throw new Error("Got non-string data for User.username() from database!");

        return t;
    }

    if(type(v) !== 'string') throw new Error("Value for User.username() must be a string!");
    return this.prop('username', v);
};

User.prototype.realname = async function(v) {
    if(v === undefined) {
        var t = await this.prop('realname');
        if(t !== null && type(t) !== 'string') throw new Error("Got non-string data for User.realname() from database!");

        return t;
    }

    if(type(v) !== 'string') throw new Error("Value for User.realname() must be a string!");
    return this.prop('realname', v);
};

User.prototype.admin = async function(v) {
    if(v === undefined) return this.prop('admin');

    if(type(v) === 'string') {
        v = v.toLowerCase();
        if(v === 'true') { v = true; }
        else if(v === 'false') { v = false; }
        else { throw new Error("Given value for 'admin' cannot be converted to a boolean!"); }

        return this.prop('admin', v);
    } else if(type(v) === 'boolean') {
        return this.prop('admin', v);
    } else {
        throw new Error("Value for 'admin' must be a boolean.");
    }
};

User.prototype.activityCreator = async function(v) {
    if(v === undefined) return this.prop('activityCreator');

    if(type(v) === 'string') {
        v = v.toLowerCase();
        if(v === 'true') { v = true; }
        else if(v === 'false') { v = false; }
        else { throw new Error("Given value for 'activityCreator' cannot be converted to a boolean!"); }

        return this.prop('activityCreator', v);
    } else if(type(v) === 'boolean') {
        return this.prop('activityCreator', v);
    } else {
        throw new Error("Value for 'activityCreator' must be a boolean.");
    }
};

User.prototype.disabled = async function(v) {
    if(v === undefined) return this.prop('disabled');

    if(type(v) === 'string') {
        v = v.toLowerCase();
        if(v === 'true') { v = true; }
        else if(v === 'false') { v = false; }
        else { throw new Error("Given value for 'disabled' cannot be converted to a boolean!"); }

        return this.prop('disabled', v);
    } else if(type(v) === 'boolean') {
        return this.prop('disabled', v);
    } else {
        throw new Error("Value for 'disabled' must be a boolean.");
    }
};

User.prototype.passwordHash = function() { return this.prop('pw_hash'); };
User.prototype.salt = function() { return this.prop('salt'); };

/* Computes the hash of (v + user.salt) */
User.prototype.computePasswordHash = async function(v) {
    if(type(v) !== 'string')
        return Promise.reject(new TypeError('Parameter to computePasswordHash() must be a string!'));

    var hash = crypto.createHash('sha256');
    hash.update(v + (await this.salt()));
    return hash.digest();
}

/* Checks to see if the password given is the same as the user's password */
User.prototype.validatePassword = async function (pw) {
    if(type(pw) !== 'string')
        return Promise.reject(new TypeError('Parameter to validatePassword() must be a string!'));

    var inputHashDigest = await this.computePasswordHash(pw);
    var userPWHash = Buffer.from(await this.passwordHash(), 'base64');

    return userPWHash.equals(inputHashDigest);
};

/* Hashes and sets a user's password. */
User.prototype.setPassword = async function (v) {
    if(type(v) !== 'string')
        throw new TypeError('Parameter to setPassword() must be a string; got '+type(v));

    var hashDigest = await this.computePasswordHash(v);
    return this.prop('pw_hash', hashDigest.toString('base64'));
};

/* Gets information on the activities the user has done.
 * Returns an array of objects with the following form:
    {
        activity: [Activity Object ID],
        checkIn: [Timestamp for check-in],
        hours: [number of hours User spent doing activity]
    }
 */
User.prototype.getActivityHours = async function() {
    var userActivities = await dbAPI.activities.find( { 'userHours.user': this.id() } );
    return userActivities.map((activity) => {
        var entry = activity.userHours.find(e => e.user.toString() === this.id().toString());
        return {
            'activity': activity._id,
            'checkIn': entry.checkIn,
            'hours': entry.hours
        };
    });
}

User.prototype.summary = function () {
    return this.fetch().then(
        () => {
            return Promise.all([
                this.username(),
                this.realname(),
                this.admin(),
                this.disabled(),
                this.activityCreator(),
                this.updated(),
                this.created(),
            ]);
        }
    ).then(
        (retn) => {
            return {
                id: this.id(),
                username: retn[0],
                realname: retn[1],
                admin: retn[2],
                disabled: retn[3],
                activityCreator: retn[4],
                updated: retn[5],
                created: retn[6],
            };
        }
    );
};

User.generate = async function () {
    var instance = new User();
    var num_users = await dbAPI.users.count({});

    await Promise.all([
        instance.username('user'+num_users.toString()),
        instance.realname('realname'),
        instance.admin(false),
        instance.disabled(false),
        instance.activityCreator(false)
    ]);

    await instance.save();

    return instance;
};

module.exports = User;
