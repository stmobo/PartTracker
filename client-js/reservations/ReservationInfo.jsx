import React from 'react';
import {connect} from 'react-redux';
import {UpdateTime} from '../common.jsx';

function mapStateToProps(state, ownProps) {
    return {
        canEdit: state.online
    }
}

function ReservationInfo({ model, requesterModel, canEdit, onEdit, onDelete }) {
    var canEdit = navigator.onLine;
    var handleEdit = (ev) => { ev.preventDefault(); ev.stopPropagation(); onEdit(); }
    var handleDelete = (ev) => { ev.preventDefault(); ev.stopPropagation(); onDelete(); }

    return (
        <li className="inv-rsvp-item list-row">
            {model.count} reserved by <strong>{requesterModel.realname}</strong> (<strong>{requesterModel.username}</strong>)
            <UpdateTime updated={model.updated} />
            {canEdit && <span onClick={handleEdit} className="glyphicon glyphicon-pencil offset-button"></span>}
            {canEdit && <span onClick={handleDelete} className="glyphicon glyphicon-remove offset-button"></span>}
        </li>
    );
}

export default connect(mapStateToProps)(ReservationInfo);
