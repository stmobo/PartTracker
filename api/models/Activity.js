var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var User = require('api/models/User.js');
var dbAPI = require('api/db.js');

var Activity = function (id) {
    dbAPI.DatabaseItem.call(this, dbAPI.activities, id);
};

Activity.prototype = Object.create(dbAPI.DatabaseItem.prototype);
Activity.prototype.constructor = Activity;

Activity.prototype.title = function(v) { return this.prop('title', v); };
Activity.prototype.description = function(v) { return this.prop('description', v); };
Activity.prototype.startTime = function(v) { return this.prop('startTime', v); };
Activity.prototype.endTime = function(v) { return this.prop('endTime', v); };
Activity.prototype.maxHours = function(v) { return this.prop('maxHours', v); };
Activity.prototype.open = function(v) { return this.prop('open', v); };
Activity.prototype.userHours = function(v) { return this.prop('userHours', v); };       // returns an array of subdocuments with 'user' (User ObjectID) and 'hours' (double) fields

Activity.prototype.hoursForUser = async function(user, v) {
    var uid = (user instanceof User) ? user.id() : monk.id(user);
    var hourList = await this.userHours(); // use the (potentially cached) userHours list instead of making a bunch of DB calls here
    var entryIdx = hourList.findIndex(elem => elem.user === uid);

    if(v === undefined) {
        if(entryIdx === -1) {
            return;
        } else {
            return hourList[entryIdx].hours;
        }
    } else {
        if(entryIdx === -1) {
            hourList.push({
                user: uid,
                hours: v
            });
        } else {
            hourList[entryIdx].hours = v;
        }

        return this.userHours(hourList);
    }
};

module.exports = Activity;
