import React from 'react';
import { connect } from 'react-redux';

function mapStateToProps(state, ownProps) {
    var { collection, labelKey, initial, onChange } = ownProps;
    return {
        objects: Array.from(state[collection].values())
    }
}

/* Renders a dropdown list for selecting users.
 * Required props:
 * props.onChange(userID) - callback for getting the selected user ID.
 * props.initial - Initial user ID to select.
 */
class CollectionSelector extends React.Component {
    constructor(props) {
        var { objects, collection, labelKey, initial, onChange } = props;
        super(props);

        this.state = { selected: initial };
        this.onSelectChanged = this.onSelectChanged.bind(this);
    }

    onSelectChanged(ev) {
        ev.preventDefault();
        this.setState({ selected: ev.target.value });
        this.props.onChange(ev.target.value);
    }

    render() {
        var elems = this.props.objects.map(
            (object) => (<option value={object.id} key={object.id}>{object[this.props.labelKey]}</option>)
        );

        return (<select onChange={this.onSelectChanged} value={this.state.selected}>{elems}</select>);
    }
}

export default CollectionSelector = connect(mapStateToProps)(CollectionSelector);
