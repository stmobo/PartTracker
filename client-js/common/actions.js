var common = require('../common.jsx');
var store = require('./store.js');

module.exports = {
    update: updateOperation,
    update_collection: updateCollectionOperation,
    create: createOperation,
    delete: deleteOperation,
    setCurrentUser: setCurrentUser,
    setCollectionETag,
};

function updateOperation(collection, object) {
    return {
        type: 'update',
        collection: collection,
        target: object.id,
        data: object
    };
}

function updateCollectionOperation(collectionName, newCollection) {
    return {
        type: 'update-collection',
        collection: collectionName,
        data: newCollection
    };
}

function createOperation(collection, object) {
    return {
        type: 'create',
        collection: collection,
        target: object.id,
        data: object
    };
}

function deleteOperation(collection, objectOrID) {
    if(typeof objectOrID === 'object') {
        return {
            type: 'delete',
            collection: collection,
            target: objectOrID.id
        };
    } else if(typeof objectOrID === 'string') {
        return {
            type: 'delete',
            collection: collection,
            target: objectOrID
        };
    }
}


function setCurrentUser(userObject) {
    return {
        type: 'set-current-user',
        user: userObject
    }
}

function setCollectionETag(collection, etag) {
    return {
        type: 'set-collection-etag',
        collection,
        data: etag,
    }
}
