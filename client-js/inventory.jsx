import "babel-polyfill";

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import ItemList from './inventory/ItemList.jsx';

import { store } from './common/store.js';
import api from './common/api.js';

ReactDOM.render(
    <Provider store={store}>
        <ItemList />
    </Provider>,
    document.getElementById('root')
);

store.dispatch(api.readCollection('users'));
store.dispatch(api.readCollection('reservations'));
store.dispatch(api.readCollection('inventory'));
store.dispatch(api.getCurrentUser());
