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

    events: {
        'click .add-new-rsvp': 'onNewRsvp',
        'submit .new-rsvp-form': 'onSubmitRsvp',
        'reset .new-rsvp-form': 'onResetRsvp',
    },

    toggleHidden: function () {
        if(!this.hidden) {
            this.$el.slideUp();
        } else {
            this.$el.slideDown();
        }

        this.hidden = !this.hidden;
    },

    showRsvpForm: function () {
        this.$('.new-rsvp-form').slideDown();
        this.$('.add-new-rsvp').slideUp();
    },

    hideRsvpForm: function () {
        this.$('.new-rsvp-form').slideUp();
        this.$('.add-new-rsvp').slideDown();
    },

    onNewRsvp: function(evt) {
        console.log("Add New RSVP clicked...");
        this.showRsvpForm();
    },

    onSubmitRsvp: function (evt) {
        console.log("Submit New RSVP clicked...");
        console.log(this.collection.partID);

        this.collection.create({
            requester: this.$("#requester").val(),
            count: this.$("#count").val(),
            part: this.collection.partID,
        });

        this.hideRsvpForm();

        evt.preventDefault();
    },

    onResetRsvp: function (evt) {
        console.log("Reset New RSVP clicked...");
        this.$('#requester').val('');
        this.$('#count').val('0');
        this.hideRsvpForm();

        evt.preventDefault();
    },

    render: function() {
        // prep the DOM:
        // clear out the old content, recreate the <td> element
        this.$('.inv-rsvp-item').detach();
        this.$('.add-new-rsvp, .new-rsvp-form').detach();

        this.collection.each(
            (model) => {
                var html = this.tmpl(model.toJSON());
                this.$el.append(html);
            },
            this
        );

        this.$el.append($('#inv-rsvp-add-template').html());

        if(this.hidden){
            this.$el.hide();
        }

        this.$('.new-rsvp-form').hide();

        this.delegateEvents();

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

        this.listenTo(this.model, 'sync', this.render);
        this.model.listenTo(this.partRsvps, 'sync', this.fetch);
        
        this.partRsvps.fetch();
    },

    events: {
        'click .inv-data-row,li' : 'onClick',
    },

    onClick: function (evt) {
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

        tr_ctxt_class = "";

        if(this.model.get('available') == 0) {
            data['status'] = "Unavailable";
            tr_ctxt_class = 'status-unavailable';
        } else {
            data['status'] = "Available";
            tr_ctxt_class = 'status-available';
        }

        var html = this.tmpl(data);

        /* do $el.html, but rebind events in the middle... */
        this.$el.empty();

        this.delegateEvents();
        this.rsvpView.delegateEvents();

        this.$el.append(html).addClass(tr_ctxt_class);
        this.$el.append(this.rsvpView.el);

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
                inv_table.append(view.render().el);
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
