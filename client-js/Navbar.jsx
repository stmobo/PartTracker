/* File / classes for navbars, displaying current user info, etc. */
import React from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';
import {
  BrowserRouter as Router,
  Route,
  Link,
  withRouter
} from 'react-router-dom';

import api from './common/api.js';

function mapStateToProps(state, ownProps) {
    return {
        username: state.current_user.username || '',
        realname: state.current_user.realname || '',
    }
}

function UserInfoHeader({realname, username}) {
    return (
        <p className="navbar-text">Welcome, <strong>{realname}</strong> (<strong>{username}</strong>)</p>
    );
}

UserInfoHeader = connect(mapStateToProps)(UserInfoHeader);

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onLogout: (ev) => {
            ev.stopPropagation();
            dispatch(api.logout(ownProps.history));
        }
    }
}

function MainNavbar({ logged_in, onLogout }) {
    if(!logged_in) return null;

    return (
        <nav className="navbar navbar-default navbar-fixed-top">
            <div className="navbar-header">
                <span className="navbar-brand">Parts Tracker</span>
            </div>
            <div className="collapse navbar-collapse" id="main-navbar">
                <ul className="nav navbar-nav">
                    <li><Link to="/inventory">Inventory</Link></li>
                    <li><Link to="/requests">Requests</Link></li>
                    <li><Link to="/activities">Activities</Link></li>
                    <li><Link to="/users">Users</Link></li>
                </ul>
                <ul className="nav navbar-nav navbar-right">
                    <li><UserInfoHeader /></li>
                    <li><a onClick={onLogout}>Logout</a></li>
                </ul>
            </div>
        </nav>
    );
}

MainNavbar = connect((state) => {
    return { logged_in: state.current_user.id !== undefined }
}, mapDispatchToProps)(MainNavbar);

export default withRouter(MainNavbar);
