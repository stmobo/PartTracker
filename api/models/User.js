var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var dbAPI = require('api/db.js');

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

User.prototype.username = function(v) { return this.prop('username', v); };
User.prototype.realname = function(v) { return this.prop('realname', v); };
User.prototype.admin = function(v) { return this.prop('admin', v); };
User.prototype.activityCreator = function(v) { return this.prop('activityCreator', v); };
User.prototype.disabled = function(v) { return this.prop('disabled', v); };

User.prototype.passwordHash = function() { return this.prop('pw_hash'); };
User.prototype.salt = function() { return this.prop('salt'); };

/* Computes the hash of (v + user.salt) */
User.prototype.computePasswordHash = function(v) {
    return this.salt().then(
        (salt) => {
            var hash = crypto.createHash('sha256');
            hash.update(v + salt);
            return hash.digest();
        }
    );
}

/* Checks to see if the password given is the same as the user's password */
User.prototype.validatePassword = function (pw) {
    return Promise.all([this.computePasswordHash(pw), this.passwordHash()]).then(
        (retns) => {
            var inputHashDigest = retns[0];
            var userPWHash = Buffer.from(retns[1], 'base64');

            return userPWHash.equals(inputHashDigest);
        }
    );
};

/* Hashes and sets a user's password. */
User.prototype.setPassword = function (v) {
    if(typeof v !== 'string')
        return Promise.reject(new TypeError('Parameter to setPassword() must be a string!'));

    return this.computePasswordHash(v).then(
        (hashDigest) => { return this.prop('pw_hash', hashDigest.toString('base64')); }
    );
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

module.exports = User;
