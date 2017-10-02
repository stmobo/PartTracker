import "babel-polyfill";

import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import Reservation from "./Reservation.jsx";
import ReservationCreator from "./ReservationCreator.jsx";

import {errorHandler, jsonOnSuccess, renderUpdateTime} from '../common.jsx';
import { store } from "../common/store.js";
import api from "../common/api.js";

function ReservationList({ collection, parentItem }) {
    var elements = collection.map(
        x => (<Reservation key={x.id} model={x} />)
    );

    return (
        <div className="inv-rsvp-list row">
            <div className="col-md-12">
                {elements.length > 0 && <ul>{elements}</ul>}
                <ReservationCreator parentItem={parentItem} />
            </div>
        </div>
    );
}

function mapStateToProps(state, ownProps) {
    var { parentItem } = ownProps;
    var rsvps = Array.from(state.reservations.values()).filter(
        rsvp => rsvp.part === parentItem.id
    );

    return {
        collection: rsvps
    };
}

ReservationList = connect(mapStateToProps)(ReservationList);
export default ReservationList;
