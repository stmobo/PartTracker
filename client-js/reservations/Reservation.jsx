import React from 'react';
import ReservationEditor from "./ReservationEditor.jsx";
import ReservationInfo from "./ReservationInfo.jsx";
import { connect } from 'react-redux';
import api from "../common/api.js";

function mapStateToProps(state, ownProps) {
    return {
        requesterModel: state.users.get(ownProps.model.requester),
        parentItem: state.inventory.get(ownProps.model.part)
    };
}

/*
 * props.onUpdate(id, model) is a callback that results in a PUT request being
 * made to the server (eventually)
 *
 * props.onDelete(id) is a callback that similarly results in a DELETE request.
 */
function mapDispatchToProps(dispatch) {
    return {
        onUpdate: (id, newModel) => {
            dispatch(api.update('reservations', newModel, id));
        },
        onDelete: (id) => {
            dispatch(api.delete('reservations', id));
        }
    };
}

class Reservation extends React.Component {
    constructor(props) {
        var { model, parentItem, requesterModel, onUpdate, onDelete } = props;
        super(props);

        this.state = { editing: false };

        this.handleUpdate = (function(newModel) {
            this.props.onUpdate(this.props.model.id, newModel);
        }).bind(this);

        this.handleDelete = (function() {
            this.props.onDelete(this.props.model.id);
        }).bind(this);

        this.startEdit = (function() { this.setState({ editing: true }); }).bind(this);
        this.stopEdit = (function() { this.setState({ editing: false }); }).bind(this);
    }

    render() {
        if(this.state.editing) {
            return (
                <li className="inv-rsvp-item">
                    <ReservationEditor model={this.props.model} parentItem={this.props.parentItem} onSubmit={this.handleUpdate} onCancel={this.stopEdit} />
                </li>
            );
        } else {
            return (<ReservationInfo model={this.props.model} requesterModel={this.props.requesterModel} onDelete={this.handleDelete} onEdit={this.startEdit} />);
        }
    }
}

Reservation = connect(mapStateToProps, mapDispatchToProps)(Reservation);

export default Reservation;
