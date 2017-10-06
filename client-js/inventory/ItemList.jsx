import React from 'react';
import { connect } from 'react-redux';

import Item from "./Item.jsx";
import ItemCreateForm from "./ItemCreateForm.jsx";
import FileUploadButton from '../common/FileUploadButton.jsx';
import api from "../common/api.js";

function ItemListHeader({ setSortKey, sortState }) {

    if(sortState.sortInverted) {
        var sortArrow = (<span className="glyphicon glyphicon-menu-up text-left"></span>);
    } else {
        var sortArrow = (<span className="glyphicon glyphicon-menu-down text-left"></span>);
    }

    return (
        <div className="list-header row">
            <div className="col-md-6" onClick={setSortKey.bind(null, 'name')}>
                {sortState.sortKey === 'name' && sortArrow}<strong>Item Name</strong>
            </div>
            <div className="col-md-2" onClick={setSortKey.bind(null, 'status')}>
                {sortState.sortKey === 'status' && sortArrow}<strong>Status</strong>
            </div>
            <div className="col-md-1" onClick={setSortKey.bind(null, 'available')}>
                {sortState.sortKey === 'available' && sortArrow}<strong>Available</strong>
            </div>
            <div className="col-md-1" onClick={setSortKey.bind(null, 'requested')}>
                {sortState.sortKey === 'requested' && sortArrow}<strong>Requested</strong>
            </div>
            <div className="col-md-1" onClick={setSortKey.bind(null, 'reserved')}>
                {sortState.sortKey === 'reserved' && sortArrow}<strong>Reserved</strong>
            </div>
            <div className="col-md-1" onClick={setSortKey.bind(null, 'count')}>
                {sortState.sortKey === 'count' && sortArrow}<strong>Total</strong>
            </div>
        </div>
    );
}

class ItemList extends React.Component {
    constructor(props) {
        var { collection, createItem, updateItem, deleteItem, importCSV } = props;
        super(props);

        this.state = { sortKey: null, sortInverted: false };
        this.setSortKey = (function(key, ev) {
            ev.stopPropagation();
            if(this.state.sortKey === key) {
                this.setState({sortInverted: !this.state.sortInverted});
            } else {
                this.setState({sortKey: key, sortInverted: false});
            }
        }).bind(this);
    }

    render() {
        var { collection, createItem, updateItem, deleteItem, importCSV } = this.props;

        var renderCol = collection;
        if(this.state.sortKey !== null) {
            renderCol = collection.slice();
            renderCol.sort((a,b) => {
                if(a[this.state.sortKey] < b[this.state.sortKey]) return -1;
                if(a[this.state.sortKey] === b[this.state.sortKey]) return 0;
                return 1;
            });

            if(this.state.sortInverted) renderCol.reverse();
        }

        var elements = renderCol.map(
            x => (<Item key={x.id} itemModel={x} onUpdate={updateItem} onDelete={deleteItem} />)
        );

        return (
            <div className="container-fluid" id="inv-table">
                <ItemListHeader setSortKey={this.setSortKey} sortState={this.state} />
                {elements}
                <ItemCreateForm createItem={createItem} />
                <div className="list-row row">
                    <div className="col-md-12">
                        <FileUploadButton accept=".csv" className="btn btn-default btn-sm list-create-new-button" onFileSelected={importCSV}>Import from CSV</FileUploadButton>
                        <a className="btn btn-default btn-sm list-create-new-button" href="/api/inventory.csv">Export to CSV</a>
                    </div>
                </div>
            </div>
        );
    }
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

export default ItemList;
