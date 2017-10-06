var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var dbAPI = require('api/db.js');
var Item = require('api/models/Item.js');
var User = require('api/models/User.js');

var type = require('type-detect');

var InventoryRequest = function (id) {
    dbAPI.DatabaseItem.call(this, dbAPI.requests, id);
};

InventoryRequest.prototype = Object.create(dbAPI.DatabaseItem.prototype);
InventoryRequest.prototype.constructor = InventoryRequest;

InventoryRequest.prototype.item = async function(v) {
    if(v === undefined) {
        var id = await this.prop('item');
        if(id === null) return null;

        return new Item(id);
    }

    var targetItem;
    if(v instanceof Item) {
        targetItem = v.id();
    } else if(v instanceof ObjectID || type(v) === 'string') {
        targetItem = monk.id(v)
    } else {
        throw new Error("Invalid value passed to #item()!");
    }

    return this.prop('item', targetItem);
};

InventoryRequest.prototype.requester = async function(v) {
    if(v === undefined) {
        var id = await this.prop('requester');
        if(id === null) return null;

        return new User(id);
    }

    var targetUser;
    if(v instanceof User) {
        targetUser = v.id();
    } else if(v instanceof ObjectID || type(v) === 'string') {
        targetUser = monk.id(v);
    } else {
        throw new Error("Invalid value passed to #requester()!");
    }

    return this.prop('requester', targetUser);
}

InventoryRequest.prototype.count = async function(v) {
    if(type(v) === 'string' && !isNaN(parseInt(v, 10))) {
        return this.prop('count', parseInt(v, 10));
    } else if(type(v) === 'number') {
        return this.prop('count', v);
    } else if(v === undefined) {
        var t = await this.prop('count');
        if(t === null || type(t) === 'number')
            return t;
        else if(type(t) === 'string' && !isNaN(parseInt(t, 10)))
            return parseInt(t, 10);
        else
            throw new Error("Got invalid number for #count() from database!");
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
    if(v === undefined) {
        var eta_str = await this.prop('eta');
        if(eta_str === null) return null;

        var t = new Date(eta_str);
        if(!isNaN(t.getTime())) return t;

        throw new Error('Retrieved date for #eta() from database is not valid!');
    }

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
        'id': this.id(),
        'item': item.id(),
        'requester': requester.id(),
        'count': count,
        'status': status,
        'eta': eta,
        'updated': updated,
        'created': created
    };
};

module.exports = InventoryRequest;
