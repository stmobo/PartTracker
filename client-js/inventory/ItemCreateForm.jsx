import React from 'react';
import ItemEditor from "./ItemEditor.jsx";

/* props.createItem is assumed to have signature createItem(newItemModel),
 * where newItemModel is an Item object that is sent to the server in a POST
 * request.
 */
export default class ItemCreateForm extends React.Component {
    constructor(props) {
        var { createItem } = props;
        super(props);

        this.state = { createFormOpen: false };

        this.openCreateForm = (function() { this.setState({ createFormOpen: true }); }).bind(this);
        this.closeCreateForm = (function() { this.setState({ createFormOpen: false }); }).bind(this);
    }

    render() {
        if(this.state.createFormOpen) {
            return (<ItemEditor onSubmit={this.props.createItem} onCancel={this.closeCreateForm} />);
        } else {
            return (
                <div className="list-row list-header row">
                    <div className="col-md-5">
                        <button className="btn btn-primary btn-default list-create-new-button" onClick={this.openCreateForm}>
                            Submit New Item
                        </button>
                    </div>
                </div>
            );
        }
    }
}
