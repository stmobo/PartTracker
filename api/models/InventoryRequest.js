var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var dbAPI = require('api/db.js');
var Item = require('api/models/Item.js');
var User = require('api/models/User.js');

var InventoryRequest = function (id) {
    dbAPI.DatabaseItem.call(this, dbAPI.requests, id);
};

InventoryRequest.prototype = Object.create(dbAPI.DatabaseItem.prototype);
InventoryRequest.prototype.constructor = InventoryRequest;

InventoryRequest.prototype.item = async function(v) {
    if(v === undefined) return this.prop('item');
    var targetItem = new Item(monk.id(v));

    if(await targetItem.exists()) {
        return this.prop('item', monk.id(v));
    } else {
        throw new Error("Requested item does not exist!");
    }
};

InventoryRequest.prototype.requester = async function(v) {
    if(v === undefined) return this.prop('requester');
    var targetUser = new User(monk.id(v));

    if(await targetUser.exists()) {
        return this.prop('requester', monk.id(v));
    } else {
        throw new Error("Requesting user does not exist!");
    }
}

InventoryRequest.prototype.count = function(v) {
    if(typeof v === 'string' && !isNaN(parseInt(v))) {
        return this.prop('count', parseInt(v));
    } else if(typeof v === 'number') {
        return this.prop('count', v);
    } else if(v === undefined) {
        return this.prop('count');
    } else {
        throw new Error("Invalid parameter for requested count!");
    }
};

InventoryRequest.prototype.status = async function(v) {
    if(v === undefined) return this.prop('status');

    if(v === 'waiting' || v === 'in_progress' || v === 'delayed' || v === 'fulfilled') {
        return this.prop('status', v);
    } else {
        throw new Error("Invalid value for status: must be one of 'waiting', 'in_progress', 'delayed', 'fulfilled'.");
    }
}

InventoryRequest.prototype.eta = async function(v) {
    if(v === undefined) return this.prop('eta');

    var targetDate = new Date(v);
    if(!isNaN(targetDate.getTime())) {
        return this.prop('eta', targetDate);
    } else {
        throw new Error('Target date is not valid.');
    }
}

InventoryRequest.prototype.summary = async function () {
    await this.fetch();

    const [item, requester, count, status, eta, updated, created] = await Promise.all([
        this.item(),
        this.requester(),
        this.count(),
        this.status(),
        this.eta(),
        this.updated(),
        this.created()
    ]);

    return {
        id: this.id(),
        item: item,
        requester: requester,
        count: count,
        status: status,
        eta: eta,
        updated: updated,
        created: created
    };
};

module.exports = InventoryRequest;
