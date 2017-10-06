import "babel-polyfill";

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import UserList from './users/UserList.jsx';

import { store } from './common/store.js';
import api from './common/api.js';


ReactDOM.render(
    <Provider store={store}>
        <UserList />
    </Provider>,
    document.getElementById('root')
);

store.dispatch(api.readCollection('users'));
store.dispatch(api.getCurrentUser());
