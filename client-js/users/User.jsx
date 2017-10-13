import React from 'react';
import UserEditor from "./UserEditor.jsx";
import UserInfo from "./UserInfo.jsx";
import { connect } from 'react-redux';

import api from "../common/api.js";
import { errorHandler } from "../common.jsx";

function mapStateToProps(state, ownProps) {
    var canEdit = false;

    if(typeof state.current_user !== 'undefined') {
        canEdit = state.current_user.admin
    }

    return {
        canEdit,
    };
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onUpdate: (newModel) => {
            dispatch(api.update('users', newModel, ownProps.model.id));
        },
        onDelete:() => {
            dispatch(api.delete('users', ownProps.model));
        },
        onPWChange: (newPassword) => {
            fetch(`/api/users/${ownProps.model.id.toString()}/password`, {
                method: 'POST',
                credentials: 'include',
                body: newPassword
            }).then(
                (res) => { if(!res.ok) throw res; }
            ).catch(errorHandler);
        },
    }
}

class User extends React.Component {
    constructor(props) {
        var { model, canEdit, onUpdate, onDelete, onPWChange } = props;
        super(props);

        this.state = { editing: false };

        this.startEditing = (function() { this.setState({editing: true}); }).bind(this);
        this.stopEditing = (function() { this.setState({editing: false}); }).bind(this);
    }

    render() {
        if(this.state.editing) {
            var renderer = (<UserEditor model={this.props.model} showPWEditBox={true} onSubmit={this.props.onUpdate} onPWChange={this.props.onPWChange} onClose={this.stopEditing} />);
        } else {
            var renderer = (<UserInfo model={this.props.model} canEdit={this.props.canEdit} onEdit={this.startEditing} onDelete={this.props.onDelete} />);
        }

        return (
            <tbody>
                {renderer}
            </tbody>
        )
    }
}

User = connect(mapStateToProps, mapDispatchToProps)(User);
export default User;
