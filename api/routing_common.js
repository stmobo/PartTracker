/* convenience functions for routing and API functions */
var express = require('express');
var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var csv = require('csv');

var Item = require('api/models/Item.js');
var Reservation = require('api/models/Reservation.js');

var winston = require('winston');
var type = require('type-detect');

var APIClientError = function(errorCode, message) {
    this.name = 'APIClientError';

    if(message === undefined) {
        // treat errorCode as the message and ignore the actual message parameter
        this.message = errorCode;
        this.resCode = 400; // default error code
    } else {
        this.message = message;
        this.resCode = parseInt(errorCode, 10);
    }
    this.stack = (new Error()).stack;
};

APIClientError.prototype = new Error;

module.exports = {
    APIClientError: APIClientError,

    errorHandlingMiddleware: async function(err, req, res, next) {
        var metadata = {
            uuid: req.uuid,
            method: req.method,
            url: req.originalUrl,
            remoteAddress: req.socket.remoteAddress,
            username: await req.user.username(),
            responseCode: 400,
            responseMsg: 'unknown message'
        }

        if(err instanceof common.APIClientError) {
            res.status(err.resCode).send(err.message);

            metadata.errorType = 'Client';
            metadata.responseCode = err.resCode;
            metadata.responseMsg = err.message;
        } else if(err instanceof Error) {
            res.status(500).send(err.stack);

            metadata.errorType = 'Server';
            metadata.responseCode = 500;
            metadata.responseMsg = err.stack;
        } else {
            res.status(400).send(err.toString());

            metadata.errorType = 'Client';
            metadata.responseCode = 400;
            metadata.responseMsg = err.toString();
        }

        winston.log('error',
            "Error "+metadata.responseCode.toString()+
            " on "+req.method+" request to "+req.originalUrl+
            " from "+req.socket.remoteAddress+
            ":\n"+metadata.responseMsg,
            metadata
        );
    },

    asyncMiddleware: function(fn) {
      return function(req, res, next) {
        Promise.resolve(fn(req, res, next))
          .catch(next);
      };
    },

    parseCSV: function(text) {
        return new Promise((resolve, reject) => {
            csv.parse(
                text,
                { columns: true, auto_parse: true },
                (err, parsedData) => {
                    if(err) return reject(err);

                    /* Convert 'true' and 'false' to boolean types,
                     * because csv.parse doesn't do this for us */
                    parsedData = parsedData.map(
                        (o) => {
                            for(k in o) {
                                if(o.hasOwnProperty(k) && type(o[k]) === 'string') {
                                    if(o[k].toLowerCase() === 'true') o[k] = true;
                                    else if(o[k].toLowerCase() === 'false') o[k] = false;
                                }
                            }

                            return o;
                        }
                    )

                    return resolve(parsedData);
                }
            );
        });
    },

    stringifyCSV: function(objects, columns) {
        // Autodetermine column names if necessary
        columns = columns || Object.getOwnPropertyNames(objects[0]);

        return new Promise((resolve, reject) => {
            csv.stringify(
                objects,
                {
                    columns: columns,
                    header: true,
                    formatters: {
                        bool: (b) => b ? 'true' : 'false',
                        date: (d) => d.toISOString(),
                        object: (o) => {
                            if(o instanceof ObjectID) return o.toString(); // prevent double-quoting object IDs
                            return JSON.stringify(o);
                        }
                    },
                },
                (err, data) => {
                    if(err) return reject(err);
                    return resolve(data);
                }
            );
        });
    },

    sendCSV: async function(res, objects, filename, columns) {
        var data = await module.exports.stringifyCSV(objects, columns);
        res.set('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).type('text/csv').send(data);
    },

    /* Tests for the existence of given keys in req.body.
     * Returns a rejection promise if a key is not found,
     *  otherwise returns a fulfilled promise.
     */
    checkRequestParameters: function (req) {
        var params = Array.prototype.slice.call(arguments, 1);
        for(let param of params) {
            if(!(param in req.body))
                return Promise.reject(new APIClientError("Missing parameter: \'"+param+"\'"));
        }
        return Promise.resolve();
    },

    /* Sends an object as JSON along with a given response code.
     * If the incoming object is an Item or a Reservation,
     * then it will be converted to a summary before being sent. */
    sendJSON: function(r, c) {
        return (function (res, stat, obj) {
            if(obj instanceof Item || obj instanceof Reservation) {
                return obj.summary().then(
                    (summ) => {
                        res.status(stat).json(summ);
                    }
                );
            } else {
                res.status(stat).json(obj);
            }
        }).bind(this, r, c);
    },

    jsonSuccess: function (r) {
        return module.exports.sendJSON(r, 200);
    },

    emptySuccess: function (r) {
        return (function (res) {
            res.status(204).end();
        }).bind(this, r);
    },
}
