/* convenience functions for routing and API functions */
var express = require('express');
var monk = require('monk');

var Item = require('api/Item.js');
var Reservation = require('api/Reservation.js');

module.exports = {
    /* Tests for the existence of given keys in req.body.
     * Returns a rejection promise if a key is not found,
     *  otherwise returns a fulfilled promise.
     */
    checkRequestParameters: function (req) {
        var params = Array.prototype.slice.call(arguments, 1);
        for(let param of params) {
            if(!(param in req.body))
                return Promise.reject("Missing parameter: \'"+param+"\'");
        }
    },

    /* Catch handler for API handler functions using promises. */
    apiErrorHandler: function (r) {
        return (function (res, err) {
            if(err instanceof Error) {
                res.status(500);
                res.send(err.stack);
            } else {
                res.status(400);
                res.send(err.toString());
            }
        }).bind(this, r);
    },

    /* Sends an object as JSON along with an HTTP 200 code.
     * If the incoming object is an Item or a Reservation,
     * then it will be converted to a summary before being sent. */
    jsonSuccess: function(r) {
        return (function (res, obj) {
            if(obj instanceof Item || obj instanceof Reservation) {
                return obj.summary().then(
                    (summ) => {
                        res.status(200).json(summ);
                    }
                );
            } else {
                res.status(200).json(obj);
            }
        }).bind(this, r);
    },

    emptySuccess: function (r) {
        return (function (res) {
            res.status(204).end();
        }).bind(this, r);
    }
}
