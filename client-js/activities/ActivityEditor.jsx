import React from 'react';
import {connect} from 'react-redux';
import api from '../common/api.js';
import {dateToInputValue} from '../common.jsx';

const defaultModel = {
    'title': 'Title',
    'description': 'Description',
    'startTime': dateToInputValue(new Date()),
    'endTime': dateToInputValue(new Date()),
    'maxHours': 0,
    'userHours': []
};

export default class ActivityEditor extends React.Component {
    constructor(props) {
        super(props);
        var { model, onSubmit, onClose } = props;

        if(!props.model) {
            this.state = this.copyModel(defaultModel);
        } else {
            this.state = this.copyModel(props.model);
        }

        this.handleFormChange = this.handleFormChange.bind(this);
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleFormReset = this.handleFormReset.bind(this);
        this.handleFormCancel = this.handleFormCancel.bind(this);
    }

    copyModel(model) {
        var copy = Object.assign({}, model);
        copy.userHours = [];

        for(let checkin of model.userHours) {
            copy.userHours.push(Object.assign({}, checkin));
        }

        // Special handling for dates:
        copy.startTime = dateToInputValue(new Date(model.startTime));
        copy.endTime = dateToInputValue(new Date(model.endTime));

        return copy;
    }

    handleFormChange(ev) {
        this.setState({
            [ev.target.name]: ev.target.value
        });
    }

    handleFormSubmit(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.props.onSubmit(this.state);
        this.props.onClose();
    }

    handleFormReset(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        if(typeof this.props.model === 'undefined') {
            this.setState(this.copyModel(defaultModel));
        } else {
            this.setState(this.copyModel(this.props.model));
        }
    }

    handleFormCancel(ev) {
        ev.preventDefault();
        this.props.onClose();
    }

    render() {
        return (
            <form onSubmit={this.handleFormSubmit} onReset={this.handleFormReset}>
                <div className="list-editor list-row row">
                    <div className="col-md-5">
                        <input type="text" name="title" placeholder="Title" value={this.state.title} onChange={this.handleFormChange} />
                    </div>
                    <div className="col-md-2">
                        {this.state.userHours.length}
                    </div>
                    <div className="col-md-1">
                        <input type="number" name="maxHours" value={this.state.maxHours} onChange={this.handleFormChange} />
                    </div>
                    <div className="col-md-2">
                        <input type="datetime-local" name="startTime" value={this.state.startTime} onChange={this.handleFormChange} />
                    </div>
                    <div className="col-md-2">
                        <input type="datetime-local" name="endTime" value={this.state.endTime} onChange={this.handleFormChange} />
                    </div>
                </div>
                <div className="list-editor list-row row">
                    <div className="col-md-12">
                        <textarea name="description" placeholder="Description..." value={this.state.description} onChange={this.handleFormChange}></textarea>
                        <div>
                            <button type="submit" name="submit" className="btn btn-success btn-xs edit-form-btn">Update</button>
                            <button type="reset"  name="reset" className="btn btn-danger btn-xs edit-form-btn">Reset</button>
                            <button type="button" name="cancel" onClick={this.handleFormCancel} className="btn btn-danger btn-xs edit-form-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            </form>
        );
    }
}
