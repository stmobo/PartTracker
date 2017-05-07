import React from 'react';
import ReactDOM from 'react-dom';
import ItemRsvpList from './ItemRsvpList.jsx';
import {errorHandler, jsonOnSuccess} from './common.jsx';

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
                <form className="new-item-form" onSubmit={this.handleFormSubmit} onReset={this.handleFormReset}>
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
 *  - id [string]: API ID for an Item.
 *
 * This class handles rendering one Item in a list, and synchronizes its
 * internal state with the API.
 */
class ItemListElement extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            count: 0,
            available: 0,
            reserved: 0,
            showRSVPList: false,
        };

        this.fetchItemData = this.fetchItemData.bind(this);
        this.handleClick = this.handleClick.bind(this);

        this.fetchItemData();
    }

    fetchItemData() {
        fetch('/api/inventory/'+this.props.id).then(jsonOnSuccess).then(
            (item) => {
                this.setState({
                    name: item.name,
                    count: item.count,
                    available: item.available,
                    reserved: item.reserved
                });
            }
        ).catch(errorHandler);
    }

    handleClick(ev) {
        this.setState({
            showRSVPList: !this.state.showRSVPList
        });
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
            rsvpList = <ItemRsvpList canAddNewRSVP={this.state.available > 0} partID={this.props.id} onListUpdated={this.fetchItemData}/>;
        }

        return (
            <div onClick={this.handleClick}>
                <div className="inv-list-item row">
                    <div className="col-md-7">{this.state.name}</div>
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

        this.retrItemList();
    }

    retrItemList() {
        fetch('/api/inventory').then(jsonOnSuccess).then(
            (items) => {
                var ids = items.map((it) => { return it.id; });
                this.setState({items: ids});
            }
        ).catch(errorHandler);
    }

    render() {
        var elems = this.state.items.map(
            (itemID) => {
                return <ItemListElement id={itemID} key={itemID} />
            }
        )

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
                <div className="row">
                    <div className="col-md-12">
                        <NewItemForm onNewItem={this.retrItemList} />
                    </div>
                </div>
            </div>
        );
    }
}
