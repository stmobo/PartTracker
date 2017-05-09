require('app-module-path').addPath(__dirname);

var express = require('express');
var app = express();

var inventory_router = require('api/inventory.js');
var reservations_router = require('api/reservations.js');
var assemblies_router = require('api/assemblies.js');

app.use('/api', inventory_router);
app.use('/api', reservations_router);
app.use('/api', assemblies_router);
app.use(express.static('static'));

app.listen(3000, () => {
    console.log("Server listening on port 3000.");
});
