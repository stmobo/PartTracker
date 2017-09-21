/* File / classes for navbars, displaying current user info, etc. */
import React from 'react';
import ReactDOM from 'react-dom';
import {errorHandler, jsonOnSuccess, getUserInfo} from './common.jsx';

/* Simple class for displaying currently logged in user.
 * Required props:
 * - username: Currently logged-in user's user name.
 * - realname: Currently logged-in user's real name.
 */
class UserInfoHeader extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <p className="navbar-text">Welcome, <strong>{this.props.realname}</strong> (<strong>{this.props.username}</strong>)</p>
        );
    }
}

/* Handles navbar stuff.
 * Info about the currently logged in user is stored as state.
 */
class MainNavBar extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            realname: '',
            admin: false
        }

        this.updateUserState = this.updateUserState.bind(this);
        this.updateUserState();
    }

    updateUserState() {
        getUserInfo().then(
            (userInfo) => {
                this.setState({
                    username: userInfo.username,
                    realname: userInfo.realname,
                    admin: userInfo.admin
                });
            }
        ).catch(errorHandler);
    }

    render() {
        return (
            <nav className="navbar navbar-default navbar-fixed-top">
                <div className="navbar-header">
                    <span className="navbar-brand">Parts Tracker</span>
                </div>
                <div className="collapse navbar-collapse" id="main-navbar">
                    <ul className="nav navbar-nav">
                        <li><a href="/inventory.html">Inventory</a></li>
                        <li><a href="/requests.html">Requests</a></li>
                        <li><a href="/users.html">Users</a></li>
                    </ul>
                    <ul className="nav navbar-nav navbar-right">
                        <li><UserInfoHeader realname={this.state.realname} username={this.state.username} /></li>
                        <li><a href="/api/logout">Logout</a></li>
                    </ul>
                </div>
            </nav>
        );
    }
}

/* Render the main navbar wherever */
ReactDOM.render(
    <MainNavBar />,
    document.getElementById('main-navbar')
);
