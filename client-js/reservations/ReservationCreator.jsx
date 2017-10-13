import React from 'react';
import { connect } from 'react-redux';
import ReservationEditor from "./ReservationEditor.jsx";
import api from "../common/api.js";

function mapDispatchToProps(dispatch) {
    return {
        onCreate: (newModel) => {
            dispatch(api.create('reservations', newModel));
        },
    };
}

/* props.createItem is assumed to have signature createItem(newItemModel),
 * where newItemModel is an Item object that is sent to the server in a POST
 * request.
 */
class ReservationCreator extends React.Component {
    constructor(props) {
        var { onCreate, parentItem } = props;
        super(props);

        this.state = { createFormOpen: false };

        this.openCreateForm = (function() { this.setState({ createFormOpen: true }); }).bind(this);
        this.closeCreateForm = (function() { this.setState({ createFormOpen: false }); }).bind(this);
    }

    render() {
        if(this.state.createFormOpen) {
            return (<ReservationEditor parentItem={this.props.parentItem} onSubmit={this.props.onCreate} onCancel={this.closeCreateForm} />);
        } else {
            return (
                <button className="btn btn-primary btn-default list-create-new-button" onClick={this.openCreateForm}>
                    Submit New Reservation
                </button>
            );
        }
    }
}


ReservationCreator = connect(function(state) { return {}; }, mapDispatchToProps)(ReservationCreator);

export default ReservationCreator;
