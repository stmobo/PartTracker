import "babel-polyfill";

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Switch,
  Redirect,
  withRouter
} from 'react-router-dom';

import MainNavbar from './Navbar.jsx';
import NotificationHandler from './Notification.jsx';
import ItemList from './inventory/ItemList.jsx';
import RequestList from './requests/RequestList.jsx';
import UserList from './users/UserList.jsx';
import ActivityList from './activities/ActivityList.jsx';

import { store, persist } from './common/store.js';
import api from './common/api.js';
import actions from './common/actions.js';

function App({  }) {
    return (
        <Provider store={store}>
            <Router>
                <div>
                    <MainNavbar />
                    <Switch>
                        <Route path="/inventory" render={withRouter(ItemList)} />
                        <Route path="/requests" render={withRouter(RequestList)} />
                        <Route path="/activities" render={withRouter(ActivityList)} />
                        <Route path="/users" render={withRouter(UserList)} />
                        <Redirect from="/" to="/inventory"/>
                    </Switch>
                    <NotificationHandler />
                </div>
            </Router>
        </Provider>
    )
}

persist.then(
    (store) => {
        ReactDOM.render(
            <App />,
            document.getElementById('root')
        );

        store.dispatch(actions.setNotification('success', 'Test notification.'))
    }
);
