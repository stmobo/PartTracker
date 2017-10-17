import React from 'react';
import {UpdateTime} from '../common.jsx';

export default function UserInfo({ model, canEdit, onEdit, onDelete }) {
    function handleEditStart(ev) {
        ev.stopPropagation();
        onEdit();
    }

    function handleDelete(ev) {
        ev.stopPropagation();
        onDelete();
    }

    var editingButtons = (
        <span className="editing-buttons">
            <abbr title="Edit" onClick={handleEditStart} className="glyphicon glyphicon-pencil offset-button"></abbr>
            <abbr title="Delete" onClick={handleDelete} className="glyphicon glyphicon-remove offset-button"></abbr>
        </span>
    );

    return (
        <tr className="list-row">
            <td className="list-username">
                {model.username}
                <UpdateTime updated={model.updated} />
                {canEdit && navigator.onLine && editingButtons}
            </td>
            <td className="list-realname">{model.realname}</td>
            <td className="list-admin">{model.admin ? "Yes" : "No"}</td>
            <td className="list-activity-creator">{model.activityCreator ? "Yes" : "No"}</td>
            <td className="list-disabled">{model.disabled ? "Yes" : "No"}</td>
        </tr>
    );
}
