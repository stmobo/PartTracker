import React from 'react';
import ReactDOM from 'react-dom';
import ItemRsvpList from './ItemRsvpList.jsx';
import {errorHandler, jsonOnSuccess} from './common.jsx';

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
            reservations: [],
            showRSVPList: false,
        };

        this.handleRSVPAdded = this.handleRSVPAdded.bind(this);
        this.handleRSVPDeleted = this.handleRSVPDeleted.bind(this);
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

                return fetch('/api/inventory/'+this.props.id+'/reservations');
            }
        ).then(jsonOnSuccess).then(
            (rsvps) => { this.setState({ reservations: rsvps }); }
        ).catch(errorHandler);
    }

    handleRSVPDeleted(rid) {
        /* Send the DELETE request to the API: */
        fetch('/api/reservations/'+rid,
            {method: 'DELETE'}).then(this.fetchItemData).catch(errorHandler);
    }

    handleRSVPAdded(requester, count) {
        var newRSVP = {part: this.props.id, count: parseInt(count), requester: requester};

        console.log(JSON.stringify(newRSVP));

        /* POST the response to the API: */
        fetch('/api/reservations', {
            method: 'POST',
            body: JSON.stringify(newRSVP),
            headers: {"Content-Type": "application/json"}
        }).then(this.fetchItemData).catch(errorHandler);
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
            rsvpList = <ItemRsvpList canAddNewRSVP={this.state.available > 0} rsvps={this.state.reservations} onRSVPAdded={this.handleRSVPAdded} onRSVPDeleted={this.handleRSVPDeleted}/>;
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
            </div>
        );
    }
}
