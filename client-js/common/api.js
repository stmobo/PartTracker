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
        var networkDataReceived = false;
        var url = `/api/${collection}/${id}`;

        // kick off the network request
        var storedElement = getState()[collection].get(id);
        var reqHeaders = {"Accept": "application/json"}
        if(storedElement !== undefined && storedElement.ETag !== undefined) {
            reqHeaders["If-None-Match"] = storedElement.ETag;
        }

        if(navigator.onLine) {
            var network_res = fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: reqHeaders,
            }).then(
                async (res) => {
                    if(res.status >= 400 && res.status <= 599) throw res;

                    networkDataReceived = true;
                    if(res.status !== 304) {
                        var fetchedObject = await res.json();
                        if(res.headers.has('ETag')) {
                            fetchedObject.ETag = res.headers.get('ETag');
                        }
                        dispatch(actions.update(collection, fetchedObject));
                    }
                }
            ).catch(common.errorHandler);
        } else {
            var network_res = Promise.reject(new Error("Cannot access network."));
        }

        // simultaneously load from cache
        var cache_res = caches.match(url).then(
            async (res) => {
                if(!res) {
                    throw new Error("Resource not in cache.");
                }

                var fetchedObject = await res.json();
                if(!networkDataReceived) {
                    dispatch(actions.update(collection, fetchedObject));
                }
            }
        ).catch(e => network_res).catch(common.errorHandler);
    }
}

function apiReadCollection(collection) {
    return async function(dispatch, getState) {
        var networkDataReceived = false;
        var url = `/api/${collection}`;

        var reqHeaders = {"Accept": "application/json"}
        if(getState().collection_etags[collection] !== undefined) {
            reqHeaders["If-None-Match"] = getState().collection_etags[collection];
        }

        // network response
        if(navigator.onLine) {
            var network_res = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: reqHeaders,
            }).then(
                async (res) => {
                    if(res.status >= 400 && res.status <= 599) throw res;

                    networkDataReceived = true;
                    if(res.status !== 304) {
                        var fetchedCollection = await res.json();
                        if(res.headers.has('ETag')) {
                            dispatch(actions.setCollectionETag(collection, res.headers.get('ETag')));
                        }
                        dispatch(actions.update_collection(collection, fetchedCollection));
                    }
                }
            ).catch(common.errorHandler);
        } else {
            var network_res = Promise.reject(new Error("Cannot access network."));
        }

        // cache response
        var cache_res = caches.match(url).then(
            async (res) => {
                if(!res) {
                    throw new Error("Collection not in cache.");
                }

                var fetchedCollection = await res.json();
                if(!networkDataReceived) {
                    dispatch(actions.update_collection(collection, fetchedCollection));
                }
            }
        ).catch(e => network_res).catch(common.errorHandler);
    }
}

function getCurrentUser() {
    return async function(dispatch, getState) {
        var networkDataReceived = false;

        var existingUserInfo = getState().current_user;
        var reqHeaders = {"Accept": "application/json"};
        if(existingUserInfo.ETag !== undefined && existingUserInfo.ETag !== '') {
            reqHeaders['If-None-Match'] = existingUserInfo.ETag;
        }

        if(navigator.onLine) {
            var network_res = await fetch('/api/user', {
                method: 'GET',
                credentials: 'include',
                headers: reqHeaders,
            }).then(
                async (res) => {
                    if(res.status === 401) {
                        // Unauthorized -- we're not really logged in
                        dispatch(actions.logout());
                        return;
                    }

                    if(res.status >= 400 && res.status <= 599) throw res;

                    networkDataReceived = true;
                    if(res.status !== 304) {
                        var fetchedUser = await res.json();
                        if(res.headers.has('ETag')) {
                            fetchedUser.ETag = res.headers.get('ETag');
                        }
                        dispatch(actions.setCurrentUser(fetchedUser));
                    }
                }
            ).catch(common.errorHandler);
        } else {
            var network_res = Promise.reject(new Error("Cannot access network."));
        }


        var cache_res = caches.match('/api/user').then(
            async (res) => {
                if(!res) {
                    throw new Error("Resource not in cache.");
                }

                var fetchedUser = await res.json();
                if(!networkDataReceived) {
                    dispatch(actions.setCurrentUser(fetchedUser));
                }
            }
        ).catch(e => network_res).catch(common.errorHandler);
    }
}

function fetchAllCollections() {
    return async function(dispatch, getState) {
        dispatch(apiReadCollection('users'));
        dispatch(apiReadCollection('reservations'));
        dispatch(apiReadCollection('inventory'));
        dispatch(apiReadCollection('activities'));
        dispatch(apiReadCollection('requests'));
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
            if(navigator.serviceWorker.controller !== null) {
                console.log('Found service worker; sending login notification.');
                navigator.serviceWorker.controller.postMessage({
                    type: 'logged-in'
                });
            } else {
                console.log('Could not find controlling service worker?');
            }

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
