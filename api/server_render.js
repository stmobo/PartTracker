var React = require('react');
var ReactDOMServer = require('react-dom/server');
var redux = require('redux');
import { Provider } from 'react-redux';
var MultiStream = require('multistream');
var fs = require('fs');

var dbAPI = require('api/db.js');
var storeAPI = require('client-js/common/store.js');

var Item = require('api/models/Item.js');
var Activity = require('api/models/Activity.js');
var User = require('api/models/User.js');
var InventoryRequest = require('api/models/InventoryRequest.js');

var ItemList = require('static/js/ItemList.js');
var ActivityList = require('static/js/ActivityList.js');
var RequestList = require('static/js/RequestList.js');
var UserList = require('static/js/UserList.js');
var MainNavBar = require('static/js/navbar.js');

async function createServerStore(req) {
    var initState = Object.assign({}, storeAPI.initialState);

    var userCollection = await Promise.all((await dbAPI.users.find({}, {})).map(x => {
        var o = new User(x._id);
        return [x._id, o.summary()];
    }));

    var itemCollection = await Promise.all((await dbAPI.inventory.find({}, {})).map(x => {
        var o = new Item(x._id);
        return [x._id, o.summary()];
    }));

    var reqCollection = await Promise.all((await dbAPI.requests.find({}, {})).map(x => {
        var o = new InventoryRequest(x._id);
        return [x._id, o.summary()];
    }));

    var activityCollection = await Promise.all((await dbAPI.activities.find({}, {})).map(x => {
        var o = new Activity(x._id);
        return [x._id, o.summary()];
    }));

    initState.users = new Map(userCollection);
    initState.activities = new Map(activityCollection);
    initState.inventory = new Map(itemCollection);
    initState.requests = new Map(reqCollection);
    initState.current_user = await req.user.summary();

    return redux.createStore(storeAPI.mainReducer, initState);
}

function getTopLevelComponents(store, component) {
    return React.createElement(
        Provider,
        {store},
        React.createElement(component)
    );
}

function readAndConcatFiles(files) {
    return new Promise((resolve, reject) => {
        try {
            var streams = files.map(
                fn => fs.createReadStream(fn)
            );

            var finalStream =  MultiStream(streams);
            var out = '';

            finalStream.on('data', (chunk) => { out = out+chunk.toString() });
            finalStream.on('end', () => { return resolve(out); });
        } catch(e) {
            reject(e);
        }
    });
}

function renderHTML(stylesheets, scripts, mainAppHTML, store) {
    var navbarTLC = getTopLevelComponents(store, MainNavBar);
    var navbarHTML = ReactDOMServer.renderToString(navbarTLC);

    var serializedState = JSON.stringify(store.getState());

    return `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Parts Tracker</title>

        <link rel="stylesheet" href="/dist/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
        <style>
        ${stylesheets}
        </style>

        <script src="/dist/js/jquery.min.js" integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4=" crossorigin="anonymous"></script>
        <script src="/dist/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
    </head>
    <div id="main-navbar">${navbarHTML}</div>
    <body>
        <div id="root">${mainAppHTML}</div>
        <script>
        window.__serverState = JSON.parse("${serializedState}");
        ${scripts}
        </script>
    </body>
</html>
    `;
}

await function renderInventory(req, res) {
    var store = await createServerStore(req);
    var mainComponent = getTopLevelComponents(store, ItemList);
    var [stylesheets, scripts] = await Promise.all([
        readAndConcatFiles([
            'static/css/inventory.css',
            'static/css/common.css'
        ]),
        readAndConcatFiles([
            'static/js/inventory.js',
            'static/js/navbar.js'
        ]),
    ]);

    var mainHTML = ReactDOMServer.renderToString(mainComponent);
    var finalHTML = renderHTML(stylesheets, scripts, mainHTML, store);

    res.type('html').status(200).send(finalHTML);
}
