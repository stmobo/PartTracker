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

    return [
        <tr key='rsvp-list' className="inv-rsvp-list">
            <td colSpan='42'>
                {elements.length > 0 && <ul>{elements}</ul>}
            </td>
        </tr>,
        <tr key='rsvp-creator'>
            <td colSpan='42'>
                <ReservationCreator parentItem={parentItem} />
            </td>
        </tr>
    ];

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
