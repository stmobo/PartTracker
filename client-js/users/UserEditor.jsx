import React from 'react';

const defaultModel = {
    username: '',
    realname: '',
    admin: false,
    disabled: false,
    activityCreator: false,
};

export default class UserEditor extends React.Component {
    constructor(props) {
        var { model, showPWEditBox, onSubmit, onClose, onPWChange } = props;
        super(props);

        if(typeof model === 'undefined') {
            this.state = Object.assign({ editingPW:false, newPassword: '' }, defaultModel);
        } else {
            this.state = Object.assign({ editingPW:false, newPassword: '' }, model);
        }

        this.handleNewPWSubmit = this.handleNewPWSubmit.bind(this);
        this.handleNewPWReset = this.handleNewPWReset.bind(this);
        this.handleNewPWStartEdit = this.handleNewPWStartEdit.bind(this);

        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleFormReset = this.handleFormReset.bind(this);

        this.handleFormCancel = this.handleFormCancel.bind(this);
        this.handleFormChange = this.handleFormChange.bind(this);
    }

    handleFormSubmit(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var newObject = Object.assign({}, this.state);
        delete newObject.newPassword;

        this.props.onSubmit(newObject);
        this.props.onClose();
    }

    handleNewPWSubmit(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.props.onPWChange(this.state.newPassword);
        this.setState({ editingPW: false, newPassword: '' });
    }

    handleNewPWReset(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.setState({ editingPW: false, newPassword: '' });
    }

    handleNewPWStartEdit(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.setState({ editingPW: true });
    }

    handleFormReset(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        if(typeof this.props.model === 'undefined') {
            this.setState(Object.assign({ editingPW:false, newPassword: '' }, defaultModel));
        } else {
            this.setState(Object.assign({ editingPW:false, newPassword: '' }, this.props.model));
        }
    }

    handleFormCancel(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.props.onClose();
    }

    handleFormChange(ev) {
        ev.stopPropagation();

        if(ev.target.name === "admin" || ev.target.name === "disabled" || ev.target.name === "activityCreator") {
            this.setState({
                [ev.target.name]: ev.target.checked
            });
        } else {
            this.setState({
                [ev.target.name]: ev.target.value
            });
        }
    }

    render() {
        var newPWForm = null;
        if(this.state.editingPW && this.props.showPWEditBox) {
            newPWForm = (
                <div className="password-editor">
                    <input type="password" name="newPassword" placeholder="Password" value={this.state.newPassword} onChange={this.handleFormChange} />
                    <button onClick={this.handleNewPWSubmit} className="btn btn-success btn-xs edit-form-btn">Save Password</button>
                    <button onClick={this.handleNewPWReset} className="btn btn-danger btn-xs edit-form-btn">Cancel Change Password</button>
                </div>
            );
        } else if(this.props.showPWEditBox) {
            newPWForm = (
                <button className="btn btn-default btn-xs" onClick={this.handleNewPWStartEdit}>Password</button>
            )
        }

        return (
            <tr className="list-row list-editor">
                <td>
                    <input type="text" name="username" placeholder="Username" value={this.state.username} onChange={this.handleFormChange} />
                    {newPWForm}
                    <button onClick={this.handleFormSubmit} className="btn btn-success btn-xs edit-form-btn">Save</button>
                    <button onClick={this.handleFormReset} className="btn btn-danger btn-xs edit-form-btn">Reset</button>
                    <button onClick={this.handleFormCancel} className="btn btn-danger btn-xs edit-form-btn">Cancel</button>
                </td>
                <td>
                    <input type="text" name="realname" placeholder="Real Name" value={this.state.realname} onChange={this.handleFormChange} />
                </td>
                <td>
                    <input type="checkbox" name="admin" checked={this.state.admin} onChange={this.handleFormChange} />
                </td>
                <td>
                    <input type="checkbox" name="activityCreator" checked={this.state.activityCreator} onChange={this.handleFormChange} />
                </td>
                <td>
                    <input type="checkbox" name="disabled" checked={this.state.disabled} onChange={this.handleFormChange} />
                </td>
            </tr>
        );
    }
}
