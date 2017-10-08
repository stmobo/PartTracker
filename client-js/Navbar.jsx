/* File / classes for navbars, displaying current user info, etc. */
import React from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';
import {
  BrowserRouter as Router,
  Route,
  Link,
  withRouter
} from 'react-router-dom'

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

export default function MainNavbar() {
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
                    <li><a href="/api/logout">Logout</a></li>
                </ul>
            </div>
        </nav>
    );
}
