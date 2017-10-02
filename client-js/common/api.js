var store = require('./store.js');
var actions = require('./actions.js');

module.exports = {
    create: apiCreate,
    update: apiUpdate,
    delete: apiDelete,
    importCSV: apiImportCSV,
    readElement: apiReadElement,
    readCollection: apiReadCollection,
}

/* Reads a collection element from the API and stores it. */
function apiReadElement(collection, objectOrID) {
    var id = objectOrID;
    if(typeof objectOrID === 'object') {
        id = objectOrID.id;
    }

    return async function(dispatch, getState) {
        var res = await fetch(`/api/${collection}/${id}`, {
            method: 'GET',
            credentials: 'include',
            headers: {"Accept": "application/json"},
        });

        if(!res.ok) return common.errorHandler(res);
        var fetchedObject = await res.json();
        dispatch(actions.update(collection, fetchedObject));
    }
}

function apiReadCollection(collection) {
    return async function(dispatch, getState) {
        var res = await fetch(`/api/${collection}`, {
            method: 'GET',
            credentials: 'include',
            headers: {"Accept": "application/json"},
        });

        if(!res.ok) return common.errorHandler(res);
        var fetchedCollection = await res.json();
        dispatch(actions.update_collection(collection, fetchedCollection));
    }
}

/* Thunk action creator for POST requests to the API. */
function apiCreate(collection, object) {
    return async function(dispatch, getState) {
        var res = await fetch(`/api/${collection}`, {
            method: 'POST',
            credentials: 'include',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(object),
        });

        if(!res.ok) return common.errorHandler(res);

        var createdObject = await res.json();

        dispatch(actions.create(collection, createdObject));
    }
}

/* Thunk action creator for PUT requests to the API. */
function apiUpdate(collection, object, id) {
    id = id || object.id;

    return async function(dispatch, getState) {
        var res = await fetch(`/api/${collection}/${id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(object),
        });

        if(!res.ok) return common.errorHandler(res);

        var updatedObject = await res.json();
        dispatch(actions.update(collection, updatedObject));
    }
}

function apiImportCSV(collection, selectedFile) {
    return async function (dispatch, getState) {
        var res = await fetch(`/api/${collection}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'text/csv', 'Accept': 'application/json' },
            body: selectedFile
        });

        if(!res.ok) return common.errorHandler(res);
        var updatedCollection = await res.json();

        dispatch(actions.update_collection(collection, updatedCollection));
    };
}

/* ... ditto for DELETE */
function apiDelete(collection, objectOrID) {
    var id = objectOrID;
    if(typeof objectOrID === 'object') {
        id = objectOrID.id;
    }

    return async function(dispatch, getState) {
        var res = await fetch(`/api/${collection}/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if(!res.ok) return common.errorHandler(res);

        dispatch(actions.delete(collection, id));
    }
}
