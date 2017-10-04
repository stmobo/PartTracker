import "babel-polyfill";

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import ActivityList from './activities/ActivityList.jsx';

import { store } from './common/store.js';
import api from './common/api.js';

store.dispatch(api.readCollection('users'));
store.dispatch(api.readCollection('activities'));
store.dispatch(api.getCurrentUser());

ReactDOM.render(
    <Provider store={store}>
        <ActivityList />
    </Provider>,
    document.getElementById('root')
);
