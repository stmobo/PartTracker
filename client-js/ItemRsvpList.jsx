import React from 'react';
import ReactDOM from 'react-dom';
import {errorHandler, jsonOnSuccess} from './common.jsx';

/*
 * Renders a single Reservation item in an ItemRsvpList.
 *
 * Props required:
 *  - model [Reservation object]: the Reservation object to render
 *  - onRSVPDeleted [callback]: called when the Delete button is clicked
 *      should have signature onRSVPDeleted(rsvp_id).
 */
class RsvpListElement extends React.Component {
    constructor(props) {
        super(props);

        this.handleRSVPDelete = this.handleRSVPDelete.bind(this);
    }

    handleRSVPDelete(ev) {
        ev.stopPropagation();
        this.props.onRSVPDeleted(this.props.model.id);
    }

    render() {
        return (
            <li className="inv-rsvp-item">
                {this.props.model.count} reserved by <strong>{this.props.model.requester}</strong>
                <span onClick={this.handleRSVPDelete} className="glyphicon glyphicon-remove rsvp-remove-button"></span>
            </li>
        );
    }
}

/*
 * Renders a list of Reservation items, as well as a form for creating new Reservations.
 *
 * Props required:
 *  - partID [string]: Part ID to list Reservations for.
 *  - canAddNewRSVP [boolean]: True if a new reservation object can be made, false otherwise
 *  - onListUpdated [callback]: called whenever the Reservation list for this item is updated
 */
export default class ItemRsvpList extends React.Component {
    constructor(props) {
        super(props);
        this.state = { reservations: [], formShown: false, requester: '', count: 0 };

        this.handleFormToggle = this.handleFormToggle.bind(this);
        this.handleFormChange = this.handleFormChange.bind(this);
        this.handleFormReset = this.handleFormReset.bind(this);

        this.handleRSVPSubmit = this.handleRSVPSubmit.bind(this);
        this.handleRSVPDeleted = this.handleRSVPDeleted.bind(this);

        this.fetchList = this.fetchList.bind(this);

        this.fetchList();
    }

    fetchList() {
        fetch('/api/inventory/'+this.props.partID+'/reservations').then(
            jsonOnSuccess
        ).then(
            (rsvps) => { this.setState({ reservations: rsvps }); }
        ).catch(errorHandler);
    }

    handleRSVPSubmit(ev) {
        ev.preventDefault();

        var newRSVP = {part: this.props.partID, count: parseInt(this.state.count), requester: this.state.requester};

        /* POST the response to the API: */
        fetch('/api/reservations', {
                method: 'POST',
                body: JSON.stringify(newRSVP),
                headers: {"Content-Type": "application/json"}
            })
        .then(this.fetchList)
        .then(this.props.onListUpdated)
        .catch(errorHandler);
    }

    handleRSVPDeleted(rid) {
        /* Send the DELETE request to the API: */
        fetch('/api/reservations/'+rid,{method: 'DELETE'})
        .then(this.fetchList)
        .then(this.props.onListUpdated)
        .catch(errorHandler);
    }



    handleFormToggle(ev) {
        this.setState({ formShown: !this.state.formShown });
        ev.stopPropagation();
    }

    handleFormChange(ev) {
        this.setState({
            [ev.target.name]: ev.target.value
        });
    }

    handleFormReset(ev) {
        ev.preventDefault();
        this.setState({count: 0, requester:'', formShown:false});
    }



    render() {
        const rsvpElems = this.state.reservations.map(
            (rsvp) => {
                return <RsvpListElement key={rsvp.id} onRSVPDeleted={this.handleRSVPDeleted} model={rsvp} />
            }
        );
        var form = null;

        if(this.state.formShown && this.props.canAddNewRSVP) {
            form = (
                <form className="new-rsvp-form" onClick={(ev) => {ev.stopPropagation();}} onSubmit={this.handleRSVPSubmit} onReset={this.handleFormReset}>
                    <button className="btn btn-danger btn-sm" type="reset">Cancel</button>
                    <div>
                        <label>Requester: <input type="text" name="requester" value={this.state.requester} onChange={this.handleFormChange} /></label>
                        <label>Count:<input type="number" name="count" value={this.state.count} onChange={this.handleFormChange} /></label>
                    </div>
                    <button type="submit" className="btn btn-success btn-sm">Add reservation</button>
                </form>
            );
        } else {
            var btnClasses = "btn btn-default btn-sm ";
            if(!this.props.canAddNewRSVP)
                btnClasses += "disabled";

            form = (
                <button
                className={btnClasses}
                onClick={ this.props.canAddNewRSVP ? this.handleFormToggle : (ev) => {ev.stopPropagation()} }>
                    Add new reservation
                 </button>
            );
        }

        return (
            <div className="inv-rsvp-list row">
                <div className="col-md-12">
                    {rsvpElems.length > 0 && <ul>{rsvpElems}</ul>}
                    {form}
                </div>
            </div>
        );
    }
}
