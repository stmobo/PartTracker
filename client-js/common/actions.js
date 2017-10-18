var common = require('../common.jsx');
var store = require('./store.js');

module.exports = {
    update: updateOperation,
    update_collection: updateCollectionOperation,
    create: createOperation,
    delete: deleteOperation,
    setCurrentUser: setCurrentUser,
    setCollectionETag,
    setNotification,
    logout,
    setOnlineStatus,
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

function logout() {
    return { type: 'logout' };
}

function setCollectionETag(collection, etag) {
    return {
        type: 'set-collection-etag',
        collection,
        data: etag,
    }
}

function setNotification(priority, message, autoTimeout) {
    if(autoTimeout === undefined) {
        return {
            type: 'set-notification',
            priority: priority,
            message: message,
        }
    } else {
        return function(dispatch, getState) {
            dispatch({
                type: 'set-notification',
                priority: priority,
                message: message,
            });

            if(autoTimeout !== undefined) {
                window.setTimeout(() => {
                    dispatch({
                        type: 'set-notification',
                        priority: undefined,
                        message: undefined,
                    });
                }, autoTimeout);
            }
        }
    }
}

function setOnlineStatus(status) {
    return function(dispatch, getState) {
        if(status) {
            // now online
            if(getState().online !== undefined && !getState().online) {
                dispatch(setNotification('success', 'You are now online again.'));
            }
        } else {
            // now offline
            dispatch(setNotification('error', "You appear to be offline. Editing will be disabled until you're online again."));
        }

        dispatch({
            type: 'set-online-status',
            status
        });
    }
}
