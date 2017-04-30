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


var Reservations = Backbone.Collection.extend({
    url: "/api/reservations",
    model: ReservationModel
});

function getPartReservations(partID) {
    var rsvp = new Reservations();
    rsvp.partID = partID;
    rsvp.url = "/api/inventory/"+partID+"/reservations";

    return rsvp;
}

module.exports = {
    Item: ItemModel,
    Reservation: ReservationModel,
    Inventory: Inventory,
    Reservations: Reservations,
    getPartReservations: getPartReservations
};
