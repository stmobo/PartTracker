var redux = require('redux');
import {persistStore, autoRehydrate, createTransform} from 'redux-persist';
import {REHYDRATE} from 'redux-persist/constants'
var thunkMiddleware = require('redux-thunk').default;
import { composeWithDevTools } from 'redux-devtools-extension';

import localforage from 'localforage';
var localforage_store = localforage.createInstance({
  name: "PartsTracker"
});

const initialState = {
    inventory: new Map(),
    reservations: new Map(),
    requests: new Map(),
    activities: new Map(),
    users: new Map(),
    collection_etags: {},
    logged_in: false,
    current_user: {
        username: '',
        realname: '',
        activityCreator: false,
        admin: false,
        disabled: false,
        ETag: '',
    },
    notification: {}
}

/* Main state shape:
    {
        "inventory": { <Collection of Item objects> },
        "reservations": { <Collection of Reservation objects> },
        "requests": { <Collection of InventoryRequest objects> },
        "activities": { <Collection of Activity objects> },
        "users": { <Collection of User objects> },
        "current_user": <User ID>
    }

    Note that this is effectively the same thing as the the API.
    However, in each collection, objects are indexed by ID
    (i.e. use store.inventory[itemID])

    The Actions available with these collections are basically just CRUD
    operations; these take the form:
    action = {
        "type": <'create' / 'update' / 'update-collection' / 'delete'>,
        "collection": <'inventory' / 'reservations' / 'users' / etc.>,
        "target": <Object ID to act upon>,
        "data": (object data to create / update, if needed)
    }

    The update-collection operation is a collection-wide update operation.
    (as opposed to regular 'update' which acts on single elements)
    It takes in a raw list of elements (like that returned by the API),
    and updates the collection accordingly.
 */

function collection_op_reducer(state, action) {
    var stateClone = Object.assign({}, state);

    if(action.type === 'update-collection') {
        var newCollection = new Map();
        action.data.forEach(elem => { newCollection.set(elem.id, elem); });
        stateClone[action.collection] = newCollection;

        return stateClone;
    }

    var collectionClone = new Map(state[action.collection]);

    if(action.type === 'create' || action.type === 'update') {
        collectionClone.set(action.target, action.data);
    } else if(action.type === 'delete') {
        collectionClone.delete(action.target);
    }

    stateClone[action.collection] = collectionClone;
    return stateClone;
}

/* Expected form:
    {
        'type': <'login' / 'logout'>,
        'user': <User ID, for login actions>
    }
 */
function auth_reducer(state, action) {
    var stateClone = Object.assign({}, state);
    if(action.type === 'set-current-user') {
        if(action.user === undefined || action.user.username === undefined) {
            stateClone.logged_in = false;
            stateClone.current_user = {};
        } else {
            stateClone.logged_in = true;
            stateClone.current_user = action.user;
        }

    } else if(action.type === 'logout') {
        stateClone.logged_in = false;
        stateClone.current_user = initialState.current_user;
    }

    return stateClone;
}

function etag_reducer(state, action) {
    var stateClone = Object.assign({}, state);
    var etagsClone = Object.assign({}, state.collection_etags);

    if(action.type === 'set-collection-etag') {
        etagsClone[action.collection] = action.data;
        stateClone.collection_etags = etagsClone;

        return stateClone;
    }
}

function rehydrateReducer(state, action) {
    var stateClone = Object.assign({}, state, action.payload);

    stateClone.users = new Map(action.payload.users);
    stateClone.inventory = new Map(action.payload.inventory);
    stateClone.requests = new Map(action.payload.requests);
    stateClone.activities = new Map(action.payload.activities);
    stateClone.reservations = new Map(action.payload.reservations);

    return stateClone;
}

function notificationReducer(state, action) {
    var stateClone = Object.assign({}, state);
    stateClone.notification = {
        priority: action.priority,
        message: action.message
    };

    return stateClone;
}

function mainReducer(state, action) {
    if(typeof state === 'undefined') {
        return initialState;
    }

    switch(action.type) {
        case 'create':
        case 'update':
        case 'update-collection':
        case 'delete':
            return collection_op_reducer(state, action);
        case 'set-current-user':
        case 'logout':
            return auth_reducer(state, action);
        case 'set-collection-etag':
            return etag_reducer(state, action);
        case 'set-notification':
            return notificationReducer(state, action);
        case REHYDRATE:
            return rehydrateReducer(state, action);
        default:
            return state;
    }
}

var store = redux.createStore(
    mainReducer,
    composeWithDevTools(
        redux.applyMiddleware(thunkMiddleware),
        autoRehydrate()
    )
);

var persist = new Promise((resolve, reject) => {
    try {
        persistStore(store, {blacklist: ['notification'], storage: localforage_store}, () => {
            var api = require('./api.js');

            resolve(store);
        });
    } catch(e) {
        reject(e);
    }
});



module.exports = { store, persist, mainReducer, initialState };
