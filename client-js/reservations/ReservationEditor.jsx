import React from 'react';
import CollectionSelector from '../common/CollectionSelector.jsx';
import {UpdateTime} from '../common.jsx';

const defaultModel = {
    count: 0,
    requester: ''
}

export default class ReservationEditor extends React.Component {
    constructor(props) {
        var { model, parentItem, onSubmit, onCancel } = props;
        super(props);

        if(typeof model === 'undefined') {
            this.state = Object.assign({part: parentItem.id}, defaultModel);
        } else {
            this.state = Object.assign({}, model);
        }

        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleFormReset = this.handleFormReset.bind(this);
        this.handleFormCancel = this.handleFormCancel.bind(this);
        this.handleFormChange = this.handleFormChange.bind(this);

        this.handleSelectorChange = (function(selectedID) {
            this.setState({ requester: selectedID });
        }).bind(this);
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
            this.setState(Object.assign({part: this.props.parentItem.id}, defaultModel));
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

        if(ev.target.name === "count") {
            this.setState({
                count: parseInt(ev.target.value, 10),
            });
        } else {
            this.setState({
                [ev.target.name]: ev.target.value
            });
        }
    }

    render() {
        return (
            <form onSubmit={this.handleFormSubmit} onReset={this.handleFormCancel}>
                <input type="number" name="count" value={this.state.count} min="1" max={this.props.parentItem.available} onChange={this.handleFormChange} />
                reserved by
                <CollectionSelector onChange={this.handleSelectorChange} collection="users" labelKey="realname" initial={this.state.requester} />
                <button type="submit" className="btn btn-success btn-xs edit-form-btn">Save</button>
                <button type="reset" className="btn btn-danger btn-xs edit-form-btn">Reset</button>
                <button onClick={this.handleFormCancel} className="btn btn-danger btn-xs edit-form-btn">Cancel</button>
            </form>
        );
    }
}
