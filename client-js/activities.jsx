import "babel-polyfill";

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import ActivityList from './activities/ActivityList.jsx';

import { store, persist } from './common/store.js';
import api from './common/api.js';

persist.then(
    (store) => {
        ReactDOM.render(
            <Provider store={store}>
                <ActivityList />
            </Provider>,
            document.getElementById('root')
        );
    }
);
