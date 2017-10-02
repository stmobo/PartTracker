import React from 'react';
import {UpdateTime} from '../common.jsx';

export default function UserInfo({ model, canEdit, onEdit, onDelete }) {
    var editingButtons = (
        <span className="editing-buttons">
            <abbr title="Edit" onClick={this.handleEditStart} className="glyphicon glyphicon-pencil offset-button"></abbr>
            <abbr title="Delete" onClick={this.handleDelete} className="glyphicon glyphicon-remove offset-button"></abbr>
        </span>
    );

    return (
        <div className="user-list-item row">
            <div className="list-username col-md-5">
                {model.username}
                <UpdateTime updated={model.updated} />
                {canEdit && editingButtons}
            </div>
            <div className="col-md-4 list-realname">{model.realname}</div>
            <div className="col-md-1 list-admin">{model.admin ? "Yes" : "No"}</div>
            <div className="col-md-1 list-activity-creator">{model.activityCreator ? "Yes" : "No"}</div>
            <div className="col-md-1 list-disabled">{model.disabled ? "Yes" : "No"}</div>
        </div>
    );
}
