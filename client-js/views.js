var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var models = require('./models.js');

var ItemReservationView = Backbone.View.extend({
    tagName: 'ul',
    className: 'inv-rsvp-list',
    tmpl: _.template($('#inv-rsvp-template').html()),

    initialize: function () {
        this.listenTo(this.collection, 'sync', this.render);
        this.hidden = true;
    },

    toggleHidden: function () {
        if(!this.hidden) {
            this.$el.hide();
        } else {
            this.$el.show();
        }

        this.hidden = !this.hidden;
    },

    render: function() {
        // prep the DOM:
        // clear out the old content, recreate the <td> element
        this.$('.inv-rsvp-item').remove();

        this.collection.each(
            (model) => {
                var html = this.tmpl(model.toJSON());
                this.$el.append(html);
            },
            this
        );

        if(this.hidden){
            this.$el.hide();
        }

        return this;
    },
});

var InventoryItemView = Backbone.View.extend({
    tagName: 'div',
    className: 'inv-list-item row',
    tmpl: _.template($('#inv-row-template').html()),

    initialize: function () {
        this.partRsvps = models.getPartReservations(this.model.get('id'));
        this.rsvpView = new ItemReservationView({ collection: this.partRsvps });

        this.partRsvps.fetch();
    },

    events: {
        'click' : 'onClick'
    },

    onClick: function () {
        this.rsvpView.toggleHidden();
    },

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

        this.partRsvps.fetch().then(
            () => {
                this.$el.after(this.rsvpView.$el);
            }
        )

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
