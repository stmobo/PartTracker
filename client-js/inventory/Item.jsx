import React from 'react';
import {connect} from 'react-redux';
import api from '../common/api.js';
import ItemInfo from "./ItemInfo.jsx";
import ItemEditor from "./ItemEditor.jsx";
import ReservationList from "../reservations/ReservationList.jsx";

/*
 * props.onUpdate(id, model) is a callback that results in a PUT request being
 * made to the server (eventually)
 *
 * props.onDelete(id) is a callback that similarly results in a DELETE request.
 */
function mapStateToProps(state, ownProps) {
    return {};
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onUpdate: (newModel) => {
            dispatch(api.update('inventory', newModel, ownProps.model.id));
        },
        onDelete: () => {
            dispatch(api.delete('inventory', ownProps.model));
        }
    }
}

class Item extends React.Component {
    constructor(props) {
        super(props);

        this.state = { editing: false, expanded: false };

        this.startEdit = (function() { this.setState({ editing: true }); }).bind(this);
        this.stopEdit = (function() { this.setState({ editing: false }); }).bind(this);

        this.toggleRSVPList = (function(ev) {
            ev.stopPropagation();
            this.setState({ expanded: !this.state.expanded });
        }).bind(this);
    }

    render() {
        var { model, onUpdate, onDelete } = this.props;

        if(this.state.editing) {
            var itemRenderer = (<ItemEditor model={model} expanded={this.state.expanded} onSubmit={onUpdate} onCancel={this.stopEdit} />);
        } else {
            var itemRenderer = (<ItemInfo itemModel={model} expanded={this.state.expanded} onDelete={onDelete} onEdit={this.startEdit} />);
        }

        return (
            <div>
                <div onClick={this.toggleRSVPList}>{itemRenderer}</div>
                {this.state.expanded && <ReservationList parentItem={model} />}
            </div>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Item);
