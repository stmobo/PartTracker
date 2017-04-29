var Backbone = require('backbone');

var ItemModel = Backbone.Model.extend({
    defaults: {
        id: null,
        name: 0,
        count: 0,
        reserved: 0,
        available: 0
    },

    parse: function(response, options) {
        response.available = (response.count - response.reserved);
        return response;
    }

});

var ReservationModel = Backbone.Model.extend({
    defaults: {
        id: null,
        part: null,
        requester: "",
        count: 0
    }
});




var Inventory = Backbone.Collection.extend({
    url: "/api/inventory",
    model: ItemModel
});


var AllReservations = Backbone.Collection.extend({
    url: "/api/reservations",
    model: ReservationModel
});

var PartReservations = Backbone.Collection.extend({
    model: ReservationModel,
    url: function() { return "/api/inventory/"+this.partID+"/reservations"; }
})

function getPartReservations(partID) {
    return new PartReservations({ partID: partID });
}

module.exports = {
    Item: ItemModel,
    Reservation: ReservationModel,
    Inventory: Inventory,
    AllReservations: AllReservations,
    getPartReservations: getPartReservations
};
