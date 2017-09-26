import React from 'react';

/* Required props:
 *  props.onFileSelected(fileInputElement) -- callback called on file select;
 *   fileInputElement is the DOM object corresponding to the <input> element.
 *  props.className -- String containing CSS classes for styling
 *  Children objects are added as children of the button element.
 */
export default class FileUploadButton extends React.Component {
    constructor(props) {
        super(props);

        this.handleButtonClick = this.handleButtonClick.bind(this);
        this.handleFileInputChange = this.handleFileInputChange.bind(this);
    }

    handleButtonClick(ev) {
        this.fileInput.click();
    }

    handleFileInputChange(ev) {
        this.props.onFileSelected(this.fileInput);
    }

    render() {
        const fileInputStyle = {
            display: 'none'
        };

        return (
            <div>
                <button className={this.props.className} onClick={this.handleButtonClick}>
                    {this.props.children}
                </button>
                <input type="file" ref={(input) => { this.fileInput = input; }} style={fileInputStyle} onChange={this.handleFileInputChange} />
            </div>
        )
    }
}
