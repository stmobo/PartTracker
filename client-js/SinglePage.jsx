import "babel-polyfill";

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Switch,
  Redirect,
  withRouter
} from 'react-router-dom';

import MainNavbar from './Navbar.jsx';
import Login from './login.jsx';
import NotificationHandler from './Notification.jsx';
import ItemList from './inventory/ItemList.jsx';
import RequestList from './requests/RequestList.jsx';
import UserList from './users/UserList.jsx';
import ActivityList from './activities/ActivityList.jsx';

import { store, persist } from './common/store.js';
import api from './common/api.js';
import actions from './common/actions.js';

function mapStateToProps(state, ownProps) {
    return {
        logged_in: typeof state.current_user.id !== 'undefined'
    };
}

function PrivateRoute({ logged_in, component: Component, ...rest }) {
    return (<Route {...rest} render={
        (props) => {
            if(!logged_in) {
                return (<Redirect to={{
                  pathname: '/login',
                  state: { from: props.location }
              }}/>);
            } else {
                return withRouter(Component)(props);
            }
        }
    } />);
}

PrivateRoute = withRouter(connect(mapStateToProps)(PrivateRoute));

function App({ store }) {
    return (
        <Provider store={store}>
            <Router>
                <div>
                    <MainNavbar />
                    <Switch>
                        <Route path="/login" render={withRouter(Login)} />
                        <PrivateRoute path="/inventory" component={ItemList} />
                        <PrivateRoute path="/activities" component={ActivityList} />
                        <PrivateRoute path="/requests" component={RequestList} />
                        <PrivateRoute path="/users" component={UserList} />
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
        if(store.getState().current_user.id !== undefined) {
            store.dispatch(api.getCurrentUser());

            /* Test current user again -- last call might have cleared it */
            if(store.getState().current_user.id !== undefined) {
                store.dispatch(api.fetchAllCollections());
            }
        }
    }
);

function updateOnlineStatus() {
    store.dispatch(actions.setOnlineStatus(navigator.onLine));
}

/* listen for on/off-line events */
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

window.addEventListener('load', function() {
    updateOnlineStatus();

    ReactDOM.render(
        <App store={store} />,
        document.getElementById('root')
    );
});

/* Install service worker */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(
        (registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
            registration.onupdatefound = () => {
                store.dispatch(actions.setNotification('success', "Caching complete. You should be able to access this page while offline now."));
            }
        }
    ).catch(
        (err) => {
            console.log('ServiceWorker registration failed: ', err);
            store.dispatch(actions.setNotification('error', "Service worker registration failed; check console for details."));
        }
    )
}
