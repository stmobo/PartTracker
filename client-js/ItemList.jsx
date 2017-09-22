import React from 'react';
import ReactDOM from 'react-dom';
import ItemRsvpList from './ItemRsvpList.jsx';
import {errorHandler, jsonOnSuccess, renderUpdateTime} from './common.jsx';

/*
 * Renders a form for adding new item types to the inventory.
 *
 * Required props:
 *  onNewItem [callback]: called when a new item type has been added (on form submit)
 */
class NewItemForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            count: 0,
            showForm: false
        }

        this.handleFormOpen = this.handleFormOpen.bind(this);
        this.handleFormChange = this.handleFormChange.bind(this);
        this.handleFormReset = this.handleFormReset.bind(this);
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
    }

    handleFormOpen(ev) {
        ev.preventDefault();
        this.setState({showForm: true});
    }

    handleFormChange(ev) {
        this.setState({
            [ev.target.name]: ev.target.value
        });
    }

    handleFormReset(ev) {
        ev.preventDefault();
        this.setState({ name: '', count:0, showForm: false });
    }

    handleFormSubmit(ev) {
        ev.preventDefault();
        fetch('/api/inventory', {
            method: 'POST',
            credentials: 'include',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                name: this.state.name,
                count: parseInt(this.state.count),
            }),
        }).then(this.props.onNewItem).catch(errorHandler);
    }

    render() {
        if(this.state.showForm) {
            return (
                <form className="new-item-form" autoComplete="off" onSubmit={this.handleFormSubmit} onReset={this.handleFormReset}>
                    <button className="btn btn-danger btn-sm" type="reset">Cancel</button>
                    <label>Name: <input type="text" name="name" value={this.state.name} onChange={this.handleFormChange} /></label>
                    <label>Count:<input type="number" name="count" value={this.state.count} onChange={this.handleFormChange} /></label>
                    <button type="submit" className="btn btn-success btn-sm">Add item</button>
                </form>
            );
        } else {
            return (
                <button className="btn btn-default btn-sm" onClick={this.handleFormOpen}>
                    Add new item type
                </button>
            );
        }
    }

}

/*
 * Props required:
 *  - model [object]: A prefetched Item object from the API.
 *  - onItemDeleted [callback]: called when the item has been deleted.
 *
 * This class handles rendering one Item in a list, and synchronizes its
 * internal state with the API.
 */
class ItemListElement extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: props.model.name,
            count: props.model.count,
            available: props.model.available,
            reserved: props.model.reserved,
            showRSVPList: false,
            editing: false,
            updated: new Date(props.model.updated),
            created: new Date(props.model.created),
        };

        this.fetchItemData = this.fetchItemData.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleDelete = this.handleDelete.bind(this);

        this.handleEditFormSubmit = this.handleEditFormSubmit.bind(this);
        this.handleEditFormReset = this.handleEditFormReset.bind(this);
        this.handleEditFormChange = this.handleEditFormChange.bind(this);
        this.handleEditStart = this.handleEditStart.bind(this);


        //this.fetchItemData();
    }

    fetchItemData() {
        fetch('/api/inventory/'+this.props.model.id, {credentials: 'include'}).then(jsonOnSuccess).then(
            (item) => {
                this.setState({
                    name: item.name,
                    count: item.count,
                    available: item.available,
                    reserved: item.reserved,
                    created: new Date(item.created),
                    updated: new Date(item.updated)
                });
            }
        ).catch(errorHandler);
    }

    handleEditFormSubmit(ev) {
        ev.preventDefault();

        fetch('/api/inventory/'+this.props.model.id, {
            method: 'PUT',
            credentials: 'include',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                name: this.state.name,
                count: parseInt(this.state.count),
            })
        }).then(
            () => { this.setState({ editing: false }) }
        ).catch(errorHandler);
    }

    handleEditFormReset(ev) {
        ev.preventDefault();

        this.setState({editing: false});
        this.fetchItemData();
    }

    handleEditFormChange(ev) {
        if(ev.target.name === "available") {
            this.setState({
                available: parseInt(ev.target.value),
                count: parseInt(ev.target.value) + this.state.reserved,
            });
        } else if(ev.target.name === "count") {
            this.setState({
                count: parseInt(ev.target.value),
                available: parseInt(ev.target.value) - this.state.reserved,
            });
        } else {
            this.setState({
                [ev.target.name]: ev.target.value
            });
        }
    }

    handleDelete(ev) {
        ev.preventDefault();

        fetch('/api/inventory/'+this.props.model.id,{method: 'DELETE', credentials: 'include'})
        .then(this.props.onItemDeleted)
        .catch(errorHandler);
    }

    handleClick(ev) { this.setState({ showRSVPList: !this.state.showRSVPList }); }
    handleEditStart(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this.setState({ editing: true })
    }

    render() {
        var tr_ctxt_class = "";
        var status = "";

        if(this.state.available == 0) {
            tr_ctxt_class = "status-unavailable";
            status = "Unvailable";
        } else {
            tr_ctxt_class = "status-available";
            status = "Available";
        }

        var rsvpList = null;
        if(this.state.showRSVPList) {
            rsvpList = <ItemRsvpList availableCount={this.state.available} partID={this.props.model.id} onListUpdated={this.fetchItemData}/>;
        }

        if(this.state.editing) {
            /* Editing row view */
            return (
                <div>
                    <form className="inv-list-item inv-list-editing row" onSubmit={this.handleEditFormSubmit} onReset={this.handleEditFormReset}>
                        <div className="col-md-7">
                            <input type="text" name="name" value={this.state.name} onChange={this.handleEditFormChange} />
                            <button type="submit" className="btn btn-success btn-xs">Save</button>
                            <button type="reset" className="btn btn-danger btn-xs">Cancel</button>
                        </div>
                        <div className="col-md-2">{status}</div>
                        <div className={"col-md-1 "+tr_ctxt_class}>
                            <input type="number" name="available" value={this.state.available} min="0" onChange={this.handleEditFormChange} />
                        </div>
                        <div className="col-md-1">{this.state.reserved}</div>
                        <div className="col-md-1">
                            <input type="number" name="count" value={this.state.count} min={this.state.reserved} onChange={this.handleEditFormChange} />
                        </div>
                    </form>
                    {rsvpList}
                </div>
            );
        } else {
            /* Standard row view */
            return (
                <div onClick={this.handleClick}>
                    <div className="inv-list-item row">
                        <div className="inv-item-name col-md-7">
                            {this.state.name}
                            {renderUpdateTime(this.state.updated)}
                            <span onClick={this.handleEditStart} className="glyphicon glyphicon-pencil offset-button"></span>
                            <span onClick={this.handleDelete} className="glyphicon glyphicon-remove offset-button"></span>
                        </div>
                        <div className="col-md-2">{status}</div>
                        <div className={"col-md-1 "+tr_ctxt_class}>{this.state.available}</div>
                        <div className="col-md-1">{this.state.reserved}</div>
                        <div className="col-md-1">{this.state.count}</div>
                    </div>
                    {rsvpList}
                </div>
            );
        }
    }
}

/*
 * Fetches and renders the Inventory from the API.
 * Requires no props.
 */
export default class ItemList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            items: []
        };

        this.retrItemList = this.retrItemList.bind(this);
        this.handleInventoryImport = this.handleInventoryImport.bind(this);
        this.handleImportClick = this.handleImportClick.bind(this);
        this.handleExport = this.handleExport.bind(this);

        this.retrItemList();
    }

    retrItemList() {
        fetch('/api/inventory', {credentials: 'include'}).then(jsonOnSuccess).then(
            (items) => {
                //var ids = items.map((it) => { return it.id; });
                this.setState({items: items});
            }
        ).catch(errorHandler);
    }

    handleInventoryImport(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var selectedFile = this.fileInput.files[0];

        fetch('/api/inventory', {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'text/csv', 'Accept': 'text/csv' },
            body: selectedFile
        }).then(
            (res) => {
                if(!res.ok) return Promise.reject(res);
                return this.retrItemList();
            }
        ).catch(errorHandler);
    }

    handleImportClick(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.fileInput.click();
    }

    handleExport(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        window.location = '/api/inventory.csv';
    }

    render() {
        var elems = this.state.items.map(
            (itemObject) => {
                return <ItemListElement model={itemObject} key={itemObject.id} onItemDeleted={this.retrItemList} />
            }
        )

        const fileInputStyle = {
            display: 'none'
        };

        return (
            <div className="container-fluid" id="inv-table">
                <div className="inv-list-header row">
                    <div className="col-md-7"><strong>Item Name</strong></div>
                    <div className="col-md-2"><strong>Status</strong></div>
                    <div className="col-md-1"><strong>Available</strong></div>
                    <div className="col-md-1"><strong>Reserved</strong></div>
                    <div className="col-md-1"><strong>Total</strong></div>
                </div>
                {elems}
                <div className="inv-list-item row">
                    <div className="col-md-12">
                        <div>
                            <button className="btn btn-default btn-sm list-create-new-button" onClick={this.handleImportClick}>Import from CSV</button>
                            <button className="btn btn-default btn-sm list-create-new-button" onClick={this.handleExport}>Export to CSV</button>
                            <input type="file" name="import-filename" accept=".csv" ref={(input) => { this.fileInput = input; }} style={fileInputStyle} onChange={this.handleInventoryImport} />
                        </div>
                        <NewItemForm onNewItem={this.retrItemList} />
                    </div>
                </div>
            </div>
        );
    }
}
