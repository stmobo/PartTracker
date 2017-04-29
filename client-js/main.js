var $ = require('jquery');
var models = require('./models.js');
var views = require('./views.js');

$(() => {
    var inv = new models.Inventory();
    var inv_view = new views.InventoryListView({collection: inv});

    inv.fetch();
});
