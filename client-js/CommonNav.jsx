/* File / classes for navbars, displaying current user info, etc. */
import React from 'react';
import ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';
import { store, persist } from './common/store.js';

function mapStateToProps(state, ownProps) {
    return {
        username: state.current_user.username || '',
        realname: state.current_user.realname || '',
    }
}

function UserInfoHeader({ realname, username }) {
    return (
        <p className="navbar-text">Welcome, <strong>{realname}</strong> (<strong>{username}</strong>)</p>
    );
}

UserInfoHeader = connect(mapStateToProps)(UserInfoHeader);

function Navbar() {
    return (
        <nav className="navbar navbar-default navbar-fixed-top">
            <div className="navbar-header">
                <span className="navbar-brand">Parts Tracker</span>
            </div>
            <div className="collapse navbar-collapse" id="main-navbar">
                <ul className="nav navbar-nav">
                    <li><a href="/inventory.html">Inventory</a></li>
                    <li><a href="/requests.html">Requests</a></li>
                    <li><a href="/activities.html">Activities</a></li>
                    <li><a href="/users.html">Users</a></li>
                </ul>
                <ul className="nav navbar-nav navbar-right">
                    <li><UserInfoHeader /></li>
                    <li><a href="/api/logout">Logout</a></li>
                </ul>
            </div>
        </nav>
    );
}

/* Render the main navbar wherever */
persist.then(
    (store) => {
        ReactDOM.render(
            <Provider store={store}>
                <Navbar />
            </Provider>,
            document.getElementById('main-navbar')
        );
    }
);
