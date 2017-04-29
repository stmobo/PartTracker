var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var models = require('./models.js');

var ItemReservationView = Backbone.View.extend({
    tagName: 'ul',
    className: 'inv-rsvp-list',
    tmpl: _.template($('#inv-rsvp-template').html()),

    initialize: function () {
        this.hidden = true;
        this.listenTo(this.collection, 'sync', this.render);
    },

    toggleHidden: function () {
        if(this.hidden) {
            this.$el.slideDown();
        } else {
            this.$el.slideUp();
        }

        this.hidden = !this.hidden;
    },

    render: function() {
        $('.inv-rsvp-item').remove();

        this.collection.each(
            (model) => {
                var html = this.tmpl(model.toJSON());
                this.$el.append($(html));
            },
            this
        );

        this.$el.hide();

        return this;
    },
});

var InventoryItemView = Backbone.View.extend({
    tagName: 'tr',
    className: 'inv-list-item',
    tmpl: _.template($('#inv-row-template').html()),

    render: function() {
        data = {
            name: this.model.get('name'),
            status: "",
            context_class: "",
            count: this.model.get('count'),
            reserved: this.model.get('reserved'),
            available: this.model.get('available')
        };

        tr_ctxt_class = "info";

        if(this.model.get('available') == 0) {
            data['status'] = "Unavailable";
            tr_ctxt_class = 'warning';
        } else {
            data['status'] = "Available";
        }

        var html = this.tmpl(data);
        this.$el.html(html).addClass(tr_ctxt_class);
        return this;
    }
});

var InventoryListView = Backbone.View.extend({
    el: '#inv-table',

    initialize: function () {
        this.listenTo(this.collection, 'sync', this.render);
    },

    render: function () {
        $('.inv-list-item').remove();
        var inv_table = $('#inv-table');

        this.collection.each(
            (model) => {
                var view = new InventoryItemView({model: model});
                inv_table.append(view.render().$el);
            },
            this
        );

        return this;
    },
});

module.exports = {
    InventoryItemView: InventoryItemView,
    InventoryListView: InventoryListView
}
