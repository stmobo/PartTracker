import "babel-polyfill";

import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import Reservation from "./Reservation.jsx";
import ReservationCreator from "./ReservationCreator.jsx";

import {errorHandler, jsonOnSuccess, renderUpdateTime} from '../common.jsx';
import { store } from "../common/store.js";
import api from "../common/api.js";

function ReservationList({ collection, parentItem, canEdit }) {
    var elements = collection.map(
        x => (<Reservation key={x.id} model={x} />)
    );

    if(canEdit) {
        var createForm = (
            <tr key='rsvp-creator'>
                <td colSpan='42'>
                    <ReservationCreator parentItem={parentItem} />
                </td>
            </tr>
        );
    } else {
        var createForm = null;
    }


    return [
        <tr key='rsvp-list' className="inv-rsvp-list">
            <td colSpan='42'>
                {elements.length > 0 && <ul>{elements}</ul>}
            </td>
        </tr>,
        createForm
    ];
}

function mapStateToProps(state, ownProps) {
    var { parentItem } = ownProps;
    var rsvps = Array.from(state.reservations.values()).filter(
        rsvp => rsvp.part === parentItem.id
    );

    return {
        collection: rsvps,
        canEdit: state.online
    };
}

ReservationList = connect(mapStateToProps)(ReservationList);
export default ReservationList;
