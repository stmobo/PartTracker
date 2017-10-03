import "babel-polyfill";

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import RequestList from './requests/RequestList.jsx';

import { store } from './common/store.js';
import api from './common/api.js';

ReactDOM.render(
    <Provider store={store}>
        <RequestList />
    </Provider>,
    document.getElementById('root')
);

store.dispatch(api.readCollection('users'));
store.dispatch(api.readCollection('inventory'));
store.dispatch(api.readCollection('requests'));
store.dispatch(api.getCurrentUser());
