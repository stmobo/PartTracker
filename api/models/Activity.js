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

/*
 * The userHours property is a bit weird, because it's an array of subdocuments.
 * Each subdocument has the following format:
    {
        user: [User Object ID -- User associated with this entry],
        hours: [double -- hour value given to User for this Activity],
        checkIn: [Date -- timestamp for when the User checked in to this Activity]
    }
 */
Activity.prototype.userHours = async function(v) {
    if(v === undefined)
        return this.prop('userHours');

    var cleanedList = v.map((doc) => {
        return {
            user: doc.user,
            hours: doc.hours,
            checkIn: new Date(doc.checkIn)
        }
    });

    for(doc of cleanedBody) {
        if(doc.hours < 0) return Promise.reject("Hours logged for "+doc.uid+" cannot be negative.");
        if(doc.hours > await this.maxHours()) return Promise.reject("Hours entry for user "+doc.uid+" exceeds maximum allowed hours for this activity.");
        if(doc.checkIn.getTime() < (await this.startTime()).getTime()) return Promise.reject("Check-in time for user "+doc.uid+" is before activity start time!");
        if(doc.checkIn.getTime() > (await this.endTime()).getTime()) return Promise.reject("Check-in time for user "+doc.uid+" is after activity end time!");

        var targetUser = new User(doc.user);
        if(!await targetUser.exists()) return Promise.reject("User with ID "+doc.uid+" does not exist!");
    }

    return this.prop('userHours', cleanedList);
};

Activity.prototype.startTime = async function(v) {
    if(v === undefined)
        return this.prop('startTime');

    var newTime = new Date(v);
    return this.prop('startTime', newTime);
};

Activity.prototype.endTime = async function(v) {
    if(v === undefined)
        return this.prop('endTime');

    var newTime = new Date(v);
    return this.prop('endTime', newTime);
};

Activity.prototype.maxHours = async function(v) {
    if(v === undefined)
        return this.prop('maxHours');

    if(typeof v !== 'number') return Promise.reject("Maximum allowed hours must be a number.");
    if(v <= 0) return Promise.reject("Maximum allowed hours cannot be negative or zero.");

    var userHours = await this.userHours();
    for(doc of userHours) {
        if(doc.hours > v) return Promise.reject("User "+doc.uid+" has more hours logged for this Activity than the new limit.");
    }

    return this.prop('maxHours', v);
};

Activity.prototype.summary = async function() {
    await this.fetch();

    return {
        'id': this.id(),
        'title': await this.title(),
        'description': await this.description(),
        'startTime': await this.startTime(),
        'endTime': await this.endTime(),
        'maxHours': await this.maxHours(),
        'userHours': await this.userHours(),
        'created': await this.created(),
        'updated': await this.updated(),
    };
}

module.exports = Activity;
