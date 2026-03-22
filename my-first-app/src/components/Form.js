import React from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { createShortLink } from "../firebase";

const isValidHttpUrl = (value) => {
    try {
        const parsedUrl = new URL(value);
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch (error) {
        return false;
    }
};


class Form extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            longURL: '',
            preferedAlias: '',
            generatedURL: '',
            loading: false,
            errors: [],
            errorMessage: {},
            toolTipMessage: 'Copy to Clipboard',
            submitError: '',
            debugDetails: '',
            debugStage: ''
        };
    }

    // when user clicks submit this is called
    onSubmit = async (event) => {
        event.preventDefault(); // prevents page from refreshing on submit
        this.setState({ 
            loading: true,
            generatedURL: '',
            submitError: '',
            debugDetails: '',
            debugStage: 'validating',
        });

        // validate the input the user has submitted
        var isFormValid = await this.validateInput();
        if (!isFormValid) {
            return;
        }

        try {
            this.setState({ debugStage: 'requesting' });
            const result = await createShortLink({
                longURL: this.state.longURL,
                preferedAlias: this.state.preferedAlias,
            });

            this.setState({
                generatedURL: result.generatedURL,
                debugStage: 'done',
            });
        } catch (error) {
            console.error("Error saving URL to database:", error);
            this.setState({
                submitError: "We couldn't create your mini link. The server returned an error while saving the URL.",
                debugDetails: `${error.code || "unknown"}${error.status ? ` | status ${error.status}` : ""}${error.details ? ` | ${error.details}` : ""}${error.url ? ` | ${error.url}` : ""}`,
                debugStage: 'failed',
            });
        } finally {
            this.setState({
                loading: false,
            });
        }
    }

    // checks if field has an error
    hasError = (key) => {
        return this.state.errors.indexOf(key) !== -1;
    }

    // save the content of the form as the user types
    handleChange = (event) => {
        const { id, value } = event.target;
        this.setState(prevState => ({
            ...prevState,
            [id]: value
        }));
    }

    validateInput = async () => {
        var errors = [];
        var errorMessage = {}

        // validate long url
        if (this.state.longURL.length === 0) {
            errors.push('longURL');
            errorMessage['longURL'] = 'Please enter a URL';
        } else if (!isValidHttpUrl(this.state.longURL)) {
            errors.push('longURL');
            errorMessage['longURL'] = 'Please enter a valid URL';
        }

        // prefered alias
        if (this.state.preferedAlias !== '') {
            if (this.state.preferedAlias.length > 7) {
                errors.push('preferedAlias');
                errorMessage['preferedAlias'] = 'Alias must be less than 7 characters';
            } else if (this.state.preferedAlias.indexOf(' ') >= 0) {
                errors.push('preferedAlias');
                errorMessage['preferedAlias'] = 'Alias cannot contain spaces';
            }
        }
        this.setState({
            errors: errors,
            errorMessage: errorMessage,
            loading: false
        });

        if (errors.length > 0) {
            return false;
        }
        return true;
    }

    copyToClipboard = () => {
        navigator.clipboard.writeText(this.state.generatedURL)
        this.setState({
            toolTipMessage: 'Copied!'
        });
    }

    render() {
        const hostLabel = typeof window !== "undefined"
            ? `${window.location.host}/`
            : "dees-ez-links.herokuapp.com/";

        return (
            <div className="container">
                <form autoComplete="off">
                    <h3>Dee's Easy Links</h3>

                    <div className="form-group">
                        <label>Enter Your Long URL</label>
                        <input
                            id="longURL"
                            onChange={this.handleChange}
                            value={this.state.longURL}
                            type="url"
                            required
                            className={
                                this.hasError("longURL")
                                    ? "form-control is-invalid"
                                    : "form-control"
                            }
                            placeholder="https://www.example.com/very/long/url"
                        />
                    </div>

                    <div
                        className={
                            this.hasError("longURL") ? "text-danger" : "visually-hidden"
                        }
                    >
                        {this.state.errorMessage.longURL}
                    </div>

                    <div className="form-group">
                        <label htmlFor="basic-url">Your Mini URL</label>
                        <div className="input-group mb-3">
                            <div className="input-group-prepend">
                                <span className="input-group-text">{hostLabel}</span>
                            </div>
                            <input
                                id="preferedAlias"
                                onChange={this.handleChange}
                                value={this.state.preferedAlias}
                                className={
                                    this.hasError("preferedAlias")
                                        ? "form-control is-invalid"
                                        : "form-control"
                                }
                                type="text" placeholder="eg. 3fwias (Optional)"
                            />
                        </div>
                        <div
                            className={
                                this.hasError("preferedAlias") ? "text-danger" : "visually-hidden"
                            }
                        >
                            {this.state.errorMessage.preferedAlias}
                        </div>
                    </div>

                    {
                        this.state.submitError === '' ? null : (
                            <div className="mb-3">
                                <div className="text-danger">{this.state.submitError}</div>
                                {
                                    this.state.debugDetails === '' ? null : (
                                        <div className="small text-muted">{this.state.debugDetails}</div>
                                    )
                                }
                                {
                                    this.state.debugStage === '' ? null : (
                                        <div className="small text-muted">stage: {this.state.debugStage}</div>
                                    )
                                }
                            </div>
                        )
                    }

                    <button className="btn btn-primary" type="button" onClick={this.onSubmit}>
                        {
                            this.state.loading ?
                            <div>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            </div> :
                            <div>
                                <span className="visually-hidden spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                <span>Mini Link It</span>
                            </div>
                        }
                    </button>

                    {
                        this.state.generatedURL === '' ?
                        <div></div> :
                        <div className="generatedurl">
                            <span>Your generated URL is: </span>
                            <div className="input-group mb-3">
                                <input disabled type="text" value={this.state.generatedURL} className="form-control" placeholder="Generated short URL" aria-label="Generated short URL" aria-describedby="basic-addon2"/>
                                <div>
                                    <OverlayTrigger
                                        key={'top'}
                                        placement={'top'}
                                        overlay={
                                            <Tooltip id={`tooltip-${'top'}`}>
                                                {this.state.toolTipMessage}
                                            </Tooltip>
                                        }
                                    >
                                        <button onClick={() => this.copyToClipboard()} data-toggle="tooltip" data-placement="top" title="Tooltip on top" className="btn btn-outline-secondary" type="button">
                                            Copy
                                        </button>
                                    </OverlayTrigger>
                                </div>
                            </div>
                        </div>
                    }
                </form>
            </div>
        );
    }
}

export default Form;
