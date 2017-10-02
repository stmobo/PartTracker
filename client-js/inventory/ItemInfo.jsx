import React from 'react';
import {UpdateTime} from '../common.jsx';

/* Renders one item statically. */
export default function ItemInfo({ itemModel, expanded, onEdit, onDelete }) {
    var tr_ctxt_class = "col-md-1 ";
    var status = "";

    if(itemModel.available === 0) {
        tr_ctxt_class += "status-unavailable";
        status = "Unvailable";
    } else {
        tr_ctxt_class += "status-available";
        status = "Available";
    }

    var handleEdit = (ev) => { ev.preventDefault(); ev.stopPropagation(); onEdit(); }
    var handleDelete = (ev) => { ev.preventDefault(); ev.stopPropagation(); onDelete(); }

    return (
        <div className="inv-list-item row">
            <div className="inv-item-name col-md-7">
                {(expanded === false) && <span className="glyphicon glyphicon-menu-down text-left"></span>}
                {(expanded === true) && <span className="glyphicon glyphicon-menu-up text-left"></span>}

                {itemModel.name}
                <UpdateTime updated={itemModel.updated} />
                <span onClick={handleEdit} className="glyphicon glyphicon-pencil offset-button"></span>
                <span onClick={handleDelete} className="glyphicon glyphicon-remove offset-button"></span>
            </div>
            <div className="col-md-2">{status}</div>
            <div className={tr_ctxt_class}>{itemModel.available}</div>
            <div className="col-md-1">{itemModel.reserved}</div>
            <div className="col-md-1">{itemModel.count}</div>
        </div>
    );
}
