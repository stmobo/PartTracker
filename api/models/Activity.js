var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var User = require('api/models/User.js');
var dbAPI = require('api/db.js');
var type = require('type-detect');

var Activity = function (id) {
    dbAPI.DatabaseItem.call(this, dbAPI.activities, id);
};

Activity.prototype = Object.create(dbAPI.DatabaseItem.prototype);
Activity.prototype.constructor = Activity;

Activity.prototype.title = async function(v) {
    if(v === undefined) return this.prop('title');

    if(type(v) !== 'string') throw new Error("Value for Activity.title must be a string!");
    return this.prop('title', v);
};
Activity.prototype.description = async function(v) {
    if(v === undefined) return this.prop('description');

    if(type(v) !== 'string') throw new Error("Value for Activity.description must be a string!");
    return this.prop('description', v);
};

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
    if(v === undefined) {
        var userHours = await this.prop('userHours');
        if(userHours === undefined || userHours === null) return [];
        else return userHours;
    }


    var cleanedList = v.map((doc) => {
        return {
            user: doc.user,
            hours: parseFloat(doc.hours, 10),
            checkIn: new Date(doc.checkIn)
        }
    });

    for(doc of cleanedList) {
        if(typeof doc.hours !== 'number') return Promise.reject("Hours logged for "+doc.user+" must be a number.");
        if(doc.hours < 0) return Promise.reject("Hours logged for "+doc.user+" cannot be negative.");
        if(doc.hours > await this.maxHours()) return Promise.reject("Hours entry for user "+doc.user+" exceeds maximum allowed hours for this activity.");
        if(doc.checkIn.getTime() < (await this.startTime()).getTime()) return Promise.reject("Check-in time for user "+doc.user+" is before activity start time!");
        if(doc.checkIn.getTime() > (await this.endTime()).getTime()) return Promise.reject("Check-in time for user "+doc.user+" is after activity end time!");

        var targetUser = new User(doc.user);
        if(!await targetUser.exists()) return Promise.reject("User with ID "+doc.user+" does not exist!");
    }

    return this.prop('userHours', cleanedList);
};

Activity.prototype.startTime = async function(v) {
    if(v === undefined) {
        var t = await this.prop('startTime');
        if(type(t) === 'string') t = new Date(t);
        if(t === null || (type(t) === 'Date' && !isNaN(t.getTime()))) return t;
        throw new Error("Got invalid value for Activity.startTime() from database!");
    }

    var newTime = new Date(v);
    if(!isNaN(newTime.getTime())) return this.prop('startTime', newTime);
    throw new Error("Start time must be a valid Date.");
};

Activity.prototype.endTime = async function(v) {
    if(v === undefined) {
        var t = await this.prop('endTime');
        if(type(t) === 'string') t = new Date(t);
        if(t === null || (type(t) === 'Date' && !isNaN(t.getTime()))) return t;
        throw new Error("Got invalid value for Activity.endTime() from database!");
    }

    var newTime = new Date(v);
    if(!isNaN(newTime.getTime())) return this.prop('endTime', newTime);
    throw new Error("End time must be a valid Date.");
};

Activity.prototype.maxHours = async function(v) {
    if(v === undefined) {
        var t = await this.prop('maxHours');
        if(t === null || type(t) === 'number') return t;
        if(type(t) === 'string' && !isNaN(parseFloat(t, 10))) return parseFloat(t, 10);
        throw new Error("Got invalid value for Activity.maxHours() from database!");
    }

    if(type(v) === 'string') v = parseFloat(v, 10);
    if(type(v) !== 'number' || isNaN(v)) throw new Error("Maximum allowed hours must be a number.");
    if(v <= 0) throw new Error("Maximum allowed hours cannot be negative or zero.");

    var userHours = await this.userHours();
    if(userHours !== null) {
        for(doc of userHours) {
            if(doc.hours > v) return Promise.reject("User "+doc.uid+" has more hours logged for this Activity than the new limit.");
        }
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

Activity.generate = async function () {
    var instance = new Activity();
    await Promise.all([
        instance.title('Test'),
        instance.description('Test'),
        instance.startTime(new Date(1)),
        instance.endTime(new Date(Date.now()+(90*24*3600*1000))),
        instance.maxHours(9999),
        instance.userHours([]),
    ]);

    await instance.save();

    return instance;
}

module.exports = Activity;
