import React from 'react';
import {renderUpdateTime} from '../common.jsx';

const defaultModel = {
    name: '',
    count: 0,
    reserved: 0,
    available: 0
};

export default class ItemEditor extends React.Component {
    constructor(props) {
        var { model, expanded, onSubmit, onCancel } = props;
        super(props);

        if(typeof model === 'undefined') {
            this.state = defaultModel;
        } else {
            this.state = Object.assign({}, model);
        }

        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleFormReset = this.handleFormReset.bind(this);
        this.handleFormCancel = this.handleFormCancel.bind(this);
        this.handleFormChange = this.handleFormChange.bind(this);
    }

    handleFormSubmit(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.props.onSubmit(this.state);
        this.props.onCancel();
    }

    handleFormReset(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        if(typeof this.props.model === 'undefined') {
            this.setState(defaultModel);
        } else {
            this.setState(Object.assign({}, this.props.model));
        }
    }

    handleFormCancel(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.props.onCancel();
    }

    handleFormChange(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        if(ev.target.name === "available") {
            this.setState({
                available: parseInt(ev.target.value, 10),
                count: parseInt(ev.target.value, 10) + this.state.reserved,
            });
        } else if(ev.target.name === "count") {
            this.setState({
                count: parseInt(ev.target.value, 10),
                available: parseInt(ev.target.value, 10) - this.state.reserved,
            });
        } else {
            this.setState({
                [ev.target.name]: ev.target.value
            });
        }
    }

    render() {
        if(this.state.available === 0) {
            var tr_ctxt_class = "status-unavailable";
            var status = "Unvailable";
        } else {
            var tr_ctxt_class = "status-available";
            var status = "Available";
        }

        return (
            <form className="inv-list-item inv-list-editing row" onSubmit={this.handleFormSubmit} onReset={this.handleFormCancel}>
                <div className="col-md-7">
                    {(this.props.expanded === false) && <span className="glyphicon glyphicon-menu-down text-left"></span>}
                    {(this.props.expanded === true) && <span className="glyphicon glyphicon-menu-up text-left"></span>}
                    <input type="text" name="name" value={this.state.name} onChange={this.handleFormChange} />
                    <button type="submit" className="btn btn-success btn-xs edit-form-btn">Save</button>
                    <button type="reset" className="btn btn-danger btn-xs edit-form-btn">Reset</button>
                    <button onClick={this.handleFormCancel} className="btn btn-danger btn-xs edit-form-btn">Cancel</button>
                </div>
                <div className="col-md-2">{status}</div>
                <div className={"col-md-1 "+tr_ctxt_class}>
                    <input type="number" name="available" value={this.state.available} min="0" onChange={this.handleFormChange} />
                </div>
                <div className="col-md-1">{this.state.reserved}</div>
                <div className="col-md-1">
                    <input type="number" name="count" value={this.state.count} min={this.state.reserved} onChange={this.handleFormChange} />
                </div>
            </form>
        );
    }
}
