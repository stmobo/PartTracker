var store = require('./store.js');
var actions = require('./actions.js');
var common = require('../common.jsx');

module.exports = {
    create: apiCreate,
    update: apiUpdate,
    delete: apiDelete,
    importCSV: apiImportCSV,
    readElement: apiReadElement,
    readCollection: apiReadCollection,
    getCurrentUser: getCurrentUser,
    checkIn: checkIn,
    login: login,
    logout: logout,
    fetchAllCollections: fetchAllCollections,
}

/* Reads a collection element from the API and stores it. */
function apiReadElement(collection, objectOrID) {
    var id = objectOrID;
    if(typeof objectOrID === 'object') {
        id = objectOrID.id;
    }

    return async function(dispatch, getState) {
        var storedElement = getState()[collection].get(id);
        var reqHeaders = {"Accept": "application/json"}
        if(storedElement !== undefined && storedElement.ETag !== undefined) {
            reqHeaders["If-None-Match"] = storedElement.ETag;
        }

        var res = await fetch(`/api/${collection}/${id}`, {
            method: 'GET',
            credentials: 'include',
            headers: reqHeaders,
        });

        if(res.status >= 400 && res.status <= 599) return common.errorHandler(res);

        if(res.status !== 304) {
            var fetchedObject = await res.json();
            if(res.headers.has('ETag')) {
                fetchedObject.ETag = res.headers.get('ETag');
            }
            dispatch(actions.update(collection, fetchedObject));
        }
    }
}

function apiReadCollection(collection) {
    return async function(dispatch, getState) {
        var reqHeaders = {"Accept": "application/json"}
        if(getState().collection_etags[collection] !== undefined) {
            reqHeaders["If-None-Match"] = getState().collection_etags[collection];
        }

        var res = await fetch(`/api/${collection}`, {
            method: 'GET',
            credentials: 'include',
            headers: reqHeaders,
        });

        if(res.status >= 400 && res.status <= 599) return common.errorHandler(res);
        if(res.status !== 304) {
            var fetchedCollection = await res.json();
            if(res.headers.has('ETag')) {
                dispatch(actions.setCollectionETag(collection, res.headers.get('ETag')));
            }
            dispatch(actions.update_collection(collection, fetchedCollection));
        }
    }
}

function getCurrentUser() {
    return async function(dispatch, getState) {
        var existingUserInfo = getState().current_user;
        var reqHeaders = {"Accept": "application/json"};
        if(existingUserInfo.ETag !== undefined && existingUserInfo.ETag !== '') {
            reqHeaders['If-None-Match'] = existingUserInfo.ETag;
        }

        var res = await fetch('/api/user', {
            method: 'GET',
            credentials: 'include',
            headers: reqHeaders,
        });

        if(res.status >= 400 && res.status <= 599) return common.errorHandler(res);
        if(res.status !== 304) {
            var fetchedUser = await res.json();
            if(res.headers.has('ETag')) {
                fetchedUser.ETag = res.headers.get('ETag');
            }
            dispatch(actions.setCurrentUser(fetchedUser));
        }
    }
}

function fetchAllCollections() {
    return async function(dispatch, getState) {
        dispatch(apiReadCollection('users'));
        dispatch(apiReadCollection('reservations'));
        dispatch(apiReadCollection('inventory'));
        dispatch(apiReadCollection('activities'));
        dispatch(apiReadCollection('requests'));
        dispatch(getCurrentUser());
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

function login(history, username, password) {
    return async function(dispatch, getState) {
        var res = await fetch('/api/login', {
            method: 'POST',
            credentials: 'include',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username: username,
                password: password,
            }),
            redirect: 'follow'
        });

        var data = await res.json();
        if(res.ok) {
            dispatch(actions.setCurrentUser(data));
            dispatch(fetchAllCollections()).then(
                () => { history.push('/'); }
            );
        } else {
            // data[0].message contains user-friendly login error message
            dispatch(actions.setNotification('error', 'Login failed: '+data[0].message));
        }
    }
}

function logout(history) {
    return async function(dispatch, getState) {
        var res = await fetch('/api/logout', {
            method: 'GET',
            credentials: 'include',
            redirect: 'follow'
        });

        if(!res.ok) return common.errorHandler(res);
        dispatch(actions.logout());
        history.push('/login');
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

function checkIn(activity) {
    return async function(dispatch, getState) {
        var res = await fetch(`/api/activities/${activity.id}/checkin`, {
            method: 'GET',
            credentials: 'include',
            headers: {"Accept": "application/json"},
        });

        if(!res.ok) return common.errorHandler(res);

        res = await fetch(`/api/activities/${activity.id}`, {
            method: 'GET',
            credentials: 'include',
            headers: {"Accept": "application/json"},
        });

        dispatch(actions.update('activities', activity.id));
     }
}
