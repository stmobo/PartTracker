require('app-module-path').addPath(__dirname);

var express = require('express');
var app = express();

var inventory_api = require('api/inventory.js');

app.use('/api', inventory_api);
app.use(express.static('static'));

app.listen(3000, () => {
    console.log("Server listening on port 3000.");
});
