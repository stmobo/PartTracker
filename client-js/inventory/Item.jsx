import React from 'react';
import ItemInfo from "./ItemInfo.jsx";
import ItemEditor from "./ItemEditor.jsx";
import ReservationList from "../reservations/ReservationList.jsx";

/*
 * props.onUpdate(id, model) is a callback that results in a PUT request being
 * made to the server (eventually)
 *
 * props.onDelete(id) is a callback that similarly results in a DELETE request.
 */
export default class Item extends React.Component {
    constructor(props) {
        var { itemModel, onUpdate, onDelete } = props;
        super(props);

        this.state = { editing: false, expanded: false };

        this.handleUpdate = (function(newModel) {
            this.props.onUpdate(this.props.itemModel.id, newModel);
        }).bind(this);

        this.handleDelete = (function() {
            this.props.onDelete(this.props.itemModel.id);
        }).bind(this);

        this.startEdit = (function() { this.setState({ editing: true }); }).bind(this);
        this.stopEdit = (function() { this.setState({ editing: false }); }).bind(this);

        this.toggleRSVPList = (function(ev) {
            ev.stopPropagation();
            this.setState({ expanded: !this.state.expanded });
        }).bind(this);
    }

    render() {
        var itemRenderer;
        if(this.state.editing) {
            itemRenderer = (<ItemEditor model={this.props.itemModel} expanded={this.state.expanded} onSubmit={this.handleUpdate} onCancel={this.stopEdit} />);
        } else {
            itemRenderer = (<ItemInfo itemModel={this.props.itemModel} expanded={this.state.expanded} onDelete={this.handleDelete} onEdit={this.startEdit} />);
        }

        return (
            <div>
                <div onClick={this.toggleRSVPList}>{itemRenderer}</div>
                {this.state.expanded && <ReservationList parentItem={this.props.itemModel} />}
            </div>
        )
    }
}
