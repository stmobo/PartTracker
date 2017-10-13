import React from 'react';
import {UpdateTime} from '../common.jsx';

export default function ReservationInfo({ model, requesterModel, onEdit, onDelete }) {
    var handleEdit = (ev) => { ev.preventDefault(); ev.stopPropagation(); onEdit(); }
    var handleDelete = (ev) => { ev.preventDefault(); ev.stopPropagation(); onDelete(); }

    return (
        <li className="inv-rsvp-item list-row">
            {model.count} reserved by <strong>{requesterModel.realname}</strong> (<strong>{requesterModel.username}</strong>)
            <UpdateTime updated={model.updated} />
            <span onClick={handleEdit} className="glyphicon glyphicon-pencil offset-button"></span>
            <span onClick={handleDelete} className="glyphicon glyphicon-remove offset-button"></span>
        </li>
    );
}
