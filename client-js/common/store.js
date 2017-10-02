var redux = require('redux');
var thunkMiddleware = require('redux-thunk').default;
import { composeWithDevTools } from 'redux-devtools-extension';

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
    if(action.type === 'login') {
        stateClone.current_user = action.user;
    } else if(action.type === 'logout') {
        stateClone.current_user = undefined;
    }

    return stateClone;
}

const initialState = {
    inventory: new Map(),
    reservations: new Map(),
    requests: new Map(),
    activities: new Map(),
    users: new Map(),
    current_user: undefined,
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
        case 'login':
        case 'logout':
            return auth_reducer(state, action);
        default:
            return state;
    }
}

var store = redux.createStore(
    mainReducer,
    composeWithDevTools(redux.applyMiddleware(thunkMiddleware))
);

module.exports = { store };
