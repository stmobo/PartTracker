import React from 'react';
import ItemInfo from "./ItemInfo.jsx";
import ItemEditor from "./ItemEditor.jsx";

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

        this.state = { editing: false };

        this.handleUpdate = (function(newModel) {
            this.props.onUpdate(this.props.itemModel.id, newModel);
        }).bind(this);

        this.handleDelete = (function() {
            this.props.onDelete(this.props.itemModel.id);
        }).bind(this);

        this.startEdit = (function() { this.setState({ editing: true }); }).bind(this);
        this.stopEdit = (function() { this.setState({ editing: false }); }).bind(this);
    }

    render() {
        if(this.state.editing) {
            return (<ItemEditor model={this.props.itemModel} onSubmit={this.handleUpdate} onCancel={this.stopEdit} />);
        } else {
            return (<ItemInfo itemModel={this.props.itemModel} onDelete={this.handleDelete} onEdit={this.startEdit} />);
        }
    }
}
