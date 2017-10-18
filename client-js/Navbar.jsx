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
        <p className="navbar-text user-info-header">Welcome, <strong>{realname}</strong> (<strong>{username}</strong>)</p>
    );
}

UserInfoHeader = connect(mapStateToProps)(UserInfoHeader);

var BootstrapNavLink = withRouter(function ({match, location, to, children}) {
    if(to === location.pathname) {
        var containerClass = 'active';
    } else {
        var containerClass = '';
    }

    return (
        <li className={containerClass}><Link to={to}>{children}</Link></li>
    )
});

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onLogout: (ev) => {
            ev.stopPropagation();
            dispatch(api.logout(ownProps.history));
        }
    }
}

function MainNavbar({ logged_in, onLogout, history, location, match }) {
    if(!logged_in) return null;

    var location_name = '';
    switch(location.pathname) {
        case '/inventory':
            location_name = 'Inventory';
            break;
        case '/requests':
            location_name = 'Requests';
            break;
        case '/activities':
            location_name = 'Activities';
            break;
        case '/users':
            location_name = 'Users';
            break;
    }

    return (
        <nav className="navbar navbar-default navbar-fixed-top">
            <div className="navbar-header">
                <span className="navbar-brand">Parts Tracker</span>
                <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#main-navbar" aria-expanded="false">
                    <span className="sr-only">Toggle Dropdown</span>
                    {location_name}<span className="caret"></span>
                </button>
            </div>
            <div className="collapse navbar-collapse" id="main-navbar">
                <ul className="nav navbar-nav">
                    <BootstrapNavLink to="/inventory">Inventory</BootstrapNavLink>
                    <BootstrapNavLink to="/requests">Requests</BootstrapNavLink>
                    <BootstrapNavLink to="/activities">Activities</BootstrapNavLink>
                    <BootstrapNavLink to="/users">Users</BootstrapNavLink>
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
    return {
        logged_in: (typeof state.current_user.id !== 'undefined')
    }
}, mapDispatchToProps)(MainNavbar);

export default withRouter(MainNavbar);
