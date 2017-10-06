import React from 'react';
import {connect} from 'react-redux';
import {UpdateTime} from '../common.jsx';
import api from '../common/api.js';

function mapStateToProps(state, ownProps) {
    var itemModel = state.inventory.get(ownProps.model.item);
    if(typeof itemModel === 'undefined') {
        itemModel = { name: 'Invalid Item' }
    }

    var requesterModel = state.users.get(ownProps.model.requester);
    if(typeof itemModel === 'undefined') {
        requesterModel = { username: '', realname: 'Invalid User' }
    }

    return {
        itemModel,
        requesterModel,
    }
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onDelete: () => {
            dispatch(api.delete('requests', ownProps.model));
        }
    };
}

function RequestInfo({ model, itemModel, requesterModel, onDelete, onEdit }) {
    var friendlyStatus = 'Unknown';
    switch(model.status) {
        case 'waiting':
            friendlyStatus = 'Waiting';
            break;
        case 'in_progress':
            friendlyStatus = 'In Progress';
            break;
        case 'delayed':
            friendlyStatus = 'Delayed';
            break;
        case 'fulfilled':
            friendlyStatus = 'Fulfilled';
            break;
    }

    var eta = new Date(model.eta);
    var formattedETA = eta.toLocaleString();

    function handleDelete(ev) {
        ev.stopPropagation();
        onDelete();
    }

    function handleEdit(ev) {
        ev.stopPropagation();
        onEdit();
    }

    return (
        <div className="list-row row">
            <div className="col-md-4">
                <strong>{itemModel.name}</strong>
                <UpdateTime updated={model.updated} />
                <button onClick={handleDelete} className="btn btn-danger btn-xs list-button">Delete</button>
                <button onClick={handleEdit} className="btn btn-default btn-xs list-button">Edit</button>
            </div>
            <div className="col-md-1">
                {model.count}
            </div>
            <div className="col-md-1">
                {friendlyStatus}
            </div>
            <div className="col-md-3">
                {requesterModel.realname} ({requesterModel.username})
            </div>
            <div className="col-md-3">
                {formattedETA}
            </div>
        </div>
    );
}

RequestInfo = connect(mapStateToProps, mapDispatchToProps)(RequestInfo);
export default RequestInfo;
