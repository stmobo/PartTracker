import React from 'react';

const defaultModel = {
    username: '',
    realname: '',
    admin: false,
    disabled: false,
    activityCreator: false,
};

class UserEditor extends React.Component {
    constructor(props) {
        var { model, onSubmit, onCancel, onPWChange } = props;
        super(props);

        if(typeof model === 'undefined') {
            this.state = Object.assign({ editingPW:false, newPassword: '' }, defaultModel);
        } else {
            this.state = Object.assign({ editingPW:false, newPassword: '' }, model);
        }

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
    }

    handleNewPWSubmit(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.props.onPWChange(this.state.newPassword);
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

        this.props.onCancel();
    }

    handleFormChange(ev) {
        ev.preventDefault();
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



    handleNewPWReset

    render() {
        var newPWForm = null;
        if(this.state.editingPW && this.props.canEdit) {
            newPWForm = (
                <form>
                    <input type="password" name="password" value={this.state.newPassword} onChange={this.handlePasswordFieldChange} />
                    <button onClick={this.handleNewPWSubmit} className="btn btn-success btn-xs">Save</button>
                    <button onClick={this.handleNewPWReset} className="btn btn-danger btn-xs">Cancel</button>
                </form>
            );
        } else if(this.props.canEdit) {
            newPWForm = (
                <abbr title="Change Password" className="glyphicon glyphicon-lock editing-buttons" onClick={this.handleNewPWStartEdit}></abbr>
            )
        }

        return (
            <form className="user-list-item user-list-editing row" onSubmit={this.handleFormSubmit} onReset={this.handleFormReset}>
                <div className="col-md-5">
                    <input type="text" name="username" value={this.state.username} onChange={this.handleFormChange} />
                    {newPWForm}
                    <button type="submit" className="btn btn-success btn-xs">Save</button>
                    <button type="reset" className="btn btn-danger btn-xs">Cancel</button>
                </div>
                <div className="col-md-4">
                    <input type="text" name="realname" value={this.state.realname} onChange={this.handleFormChange} />
                </div>
                <div className="col-md-1">
                    <input type="checkbox" name="admin" checked={this.state.admin} onChange={this.handleFormChange} />
                </div>
                <div className="col-md-1">
                    <input type="checkbox" name="activityCreator" checked={this.state.activityCreator} onChange={this.handleFormChange} />
                </div>
                <div className="col-md-1">
                    <input type="checkbox" name="disabled" checked={this.state.disabled} onChange={this.handleFormChange} />
                </div>
            </form>
        );
    }
}
