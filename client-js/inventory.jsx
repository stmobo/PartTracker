import "babel-polyfill";

import React from 'react';
import ReactDOM from 'react-dom';
import { connect, Provider } from 'react-redux';

import Item from "./inventory/Item.jsx";
import ItemCreateForm from "./inventory/ItemCreateForm.jsx";
import FileUploadButton from './common/FileUploadButton.jsx';

import {errorHandler, jsonOnSuccess, renderUpdateTime} from './common.jsx';
import { store } from "./common/store.js";
import api from "./common/api.js";

function ItemListHeader() {
    return (
        <div className="inv-list-header row">
            <div className="col-md-7"><strong>Item Name</strong></div>
            <div className="col-md-2"><strong>Status</strong></div>
            <div className="col-md-1"><strong>Available</strong></div>
            <div className="col-md-1"><strong>Reserved</strong></div>
            <div className="col-md-1"><strong>Total</strong></div>
        </div>
    );
}

function ItemList({ collection, createItem, updateItem, deleteItem, importCSV }) {
    var elements = collection.map(
        x => (<Item key={x.id} itemModel={x} onUpdate={updateItem} onDelete={deleteItem} />)
    );

    return (
        <div className="container-fluid" id="inv-table">
            <ItemListHeader />
            {elements}
            <ItemCreateForm createItem={createItem} />
            <div className="inv-list-item row">
                <div className="col-md-12">
                    <FileUploadButton accept=".csv" className="btn btn-default btn-sm list-create-new-button" onFileSelected={importCSV}>Import from CSV</FileUploadButton>
                    <a className="btn btn-default btn-sm list-create-new-button" href="/api/inventory.csv">Export to CSV</a>
                </div>
            </div>
        </div>
    );
}

function mapStateToProps(state) {
    return {
        collection: Array.from(state.inventory.values())
    };
}

function mapDispatchToProps(dispatch) {
    return {
        createItem: (newModel) => {
            dispatch(api.create('inventory', newModel));
        },
        updateItem: (id, newModel) => {
            dispatch(api.update('inventory', newModel, id));
        },
        deleteItem: (id) => {
            dispatch(api.delete('inventory', id));
        },
        importCSV: (fileInput) => {
            dispatch(api.importCSV('inventory', fileInput.files[0]));
        },
    };
}

ItemList = connect(mapStateToProps, mapDispatchToProps)(ItemList);

ReactDOM.render(
    <Provider store={store}>
        <ItemList />
    </Provider>,
    document.getElementById('root')
);

store.dispatch(api.readCollection('users'));
store.dispatch(api.readCollection('reservations'));
store.dispatch(api.readCollection('inventory'));
