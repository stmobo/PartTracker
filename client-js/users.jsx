import React from 'react';
import ReactDOM from 'react-dom';
import {errorHandler, jsonOnSuccess, renderUpdateTime} from './common.jsx';

/* Renders a single user in a list.
 * Required props:
 *  - model [User Object]: user model retrieved from API.
 *  - onDelete(id): callback to delete User with given ID.
 */
class UserListElement extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: props.model.username,
            realname: props.model.realname,
            updated: new Date(props.model.updated),
            created: new Date(props.model.created),
            admin: props.model.admin,
            disabled: props.model.disabled,
            editing: false,

            newPassword: '',
            editingPW: false,
        }

        this.fetchUserData = this.fetchUserData.bind(this);
        this.setStateFromObject = this.setStateFromObject.bind(this);

        this.handleEditFormSubmit = this.handleEditFormSubmit.bind(this);
        this.handleEditFormReset = this.handleEditFormReset.bind(this);
        this.handleEditStart = this.handleEditStart.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleEditFormChange = this.handleEditFormChange.bind(this);

        this.handlePasswordFieldChange = this.handlePasswordFieldChange.bind(this);
        this.handleNewPWSubmit = this.handleNewPWSubmit.bind(this);
        this.handleNewPWReset = this.handleNewPWReset.bind(this);
        this.handleNewPWStartEdit = this.handleNewPWStartEdit.bind(this);
    }

    fetchUserData() {
        fetch('/api/users/'+this.props.model.id, {credentials: 'include'}).then(jsonOnSuccess).then(this.setStateFromObject).catch(errorHandler);
    }

    setStateFromObject(user) {
        this.setState({
            username: user.username,
            realname: user.realname,
            created: new Date(user.created),
            updated: new Date(user.updated),
            admin: user.admin,
            disabled: user.disabled
        });
    }

    handleEditFormReset(ev) {
        ev.preventDefault();

        this.setState({editing: false});
        this.fetchUserData();
    }

    handleEditFormSubmit(ev) {
        ev.preventDefault();

        fetch('/api/users/'+this.props.model.id, {
            method: 'PUT',
            credentials: 'include',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username:   this.state.username,
                realname:   this.state.realname,
                admin:      this.state.admin,
                disabled:   this.state.disabled
            })
        }).then(
            () => { this.setState({ editing: false }) }
        ).catch(errorHandler);
    }

    handleEditFormChange(ev) {
        if(ev.target.name === "admin" || ev.target.name === "disabled") {
            this.setState({
                [ev.target.name]: ev.target.checked
            });
        } else {
            this.setState({
                [ev.target.name]: ev.target.value
            });
        }
    }

    handleEditStart(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this.setState({ editing: true });
    }

    handleDelete(ev) {
        ev.preventDefault();
        this.props.onDelete(this.props.model.id);
    }

    handlePasswordFieldChange(ev) {
        if(ev.target.name === "password") {
            this.setState({ newPassword: ev.target.value });
        }
    }

    handleNewPWSubmit(ev) {
        ev.preventDefault();

        fetch('/api/users/'+this.props.model.id+'/password', {
            method: 'POST',
            credentials: 'include',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                password: this.state.newPassword
            })
        }).then(
            () => { this.setState({ newPassword: '', editingPW: false }) }
        ).catch(errorHandler);
    }

    handleNewPWReset(ev) {
        ev.preventDefault();
        this.setState({
            editingPW: false,
            newPassword: '',
        });
    }

    handleNewPWStartEdit(ev) {
        ev.preventDefault();
        this.setState({editingPW: true});
    }


    render() {
        var newPWForm = null;
        if(this.state.editingPW) {
            newPWForm = (
                <form>
                    <input type="password" name="password" value={this.state.newPassword} onChange={this.handlePasswordFieldChange} />
                    <button onClick={this.handleNewPWSubmit} className="btn btn-success btn-xs">Save</button>
                    <button onClick={this.handleNewPWReset} className="btn btn-danger btn-xs">Cancel</button>
                </form>
            );
        } else {
            newPWForm = (
                <abbr title="Change Password" className="glyphicon glyphicon-lock offset-button" onClick={this.handleNewPWStartEdit}></abbr>
            )
        }

        if(this.state.editing) {
            /* Render editing form */
            return (
                <form className="user-list-item user-list-editing row" onSubmit={this.handleEditFormSubmit} onReset={this.handleEditFormReset}>
                    <div className="col-md-5">
                        <input type="text" name="username" value={this.state.username} onChange={this.handleEditFormChange} />
                        {newPWForm}
                        <button type="submit" className="btn btn-success btn-xs">Save</button>
                        <button type="reset" className="btn btn-danger btn-xs">Cancel</button>
                    </div>
                    <div className="col-md-5">
                        <input type="text" name="realname" value={this.state.realname} onChange={this.handleEditFormChange} />
                    </div>
                    <div className="col-md-1">
                        <input type="checkbox" name="admin" checked={this.state.admin} onChange={this.handleEditFormChange} />
                    </div>
                    <div className="col-md-1">
                        <input type="checkbox" name="disabled" checked={this.state.disabled} onChange={this.handleEditFormChange} />
                    </div>
                </form>
            )
        } else {
            /* Render standard view */
            return (
                <div className="user-list-item row">
                    <div className="list-username col-md-5">
                        {this.state.username}
                        {renderUpdateTime(this.state.updated)}
                        {newPWForm}
                        <abbr title="Edit" onClick={this.handleEditStart} className="glyphicon glyphicon-pencil offset-button"></abbr>
                        <abbr title="Delete" onClick={this.handleDelete} className="glyphicon glyphicon-remove offset-button"></abbr>
                    </div>
                    <div className="col-md-5 list-realname">{this.state.realname}</div>
                    <div className="col-md-1 list-admin">{this.state.admin ? "Yes" : "No"}</div>
                    <div className="col-md-1 list-disabled">{this.state.disabled ? "Yes" : "No"}</div>
                </div>
            );
        }
    }
}


/*
 * Fetches and renders the User list from the API.
 * Requires no props.
 */
class UserList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            users: []
        };

        this.retrUserList = this.retrUserList.bind(this);
        this.deleteUser = this.deleteUser.bind(this);

        this.retrUserList();
    }

    retrUserList() {
        fetch('/api/users', {credentials: 'include'}).then(jsonOnSuccess).then(
            (users) => {
                this.setState({users: users});
            }
        ).catch(errorHandler);
    }

    deleteUser(uid) {
        fetch('/api/users/'+uid, {method: 'DELETE', credentials: 'include'})
        .then(retrUserList).catch(errorHandler);
    }

    render() {
        var elems = this.state.users.map(
            (userObject) => {
                return <UserListElement model={userObject} key={userObject.id} onDelete={this.deleteUser} />
            }
        )

        return (
            <div className="container-fluid" id="user-table">
                <div className="user-list-header row">
                    <div className="col-md-5"><strong>User Name</strong></div>
                    <div className="col-md-5"><strong>Real Name</strong></div>
                    <div className="col-md-1"><strong>Is Admin</strong></div>
                    <div className="col-md-1"><strong>Is Disabled</strong></div>
                </div>
                {elems}
            </div>
        );
    }
}

ReactDOM.render(
    <UserList />,
    document.getElementById('root')
);
