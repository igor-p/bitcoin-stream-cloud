import React from 'react';
import PropTypes from 'prop-types';
import {DEFAULT_CURRENCY, EXCHANGE_URL, SATOSHI_PER_BTC, WEBSOCKET_URL} from "./constants";

class StreamViewer extends React.Component {
    constructor(props) {
        super(props);

        this.board = React.createRef();

        this.state = {
            data: [],
            rates: {}
        };

        this.receiveData = this.receiveData.bind(this);

        this.getRates();
        // Socket shouldn't be in state as it isn't tied to the view
        this.socket = new WebSocket(WEBSOCKET_URL);

        this.socket.onopen = e => {
            console.log('Opened connection');
            //this.sendData({op: 'ping'});
            this.subscribe();
        };

        this.socket.onmessage = this.receiveData;
    }

    componentWillUnmount() {
        this.unsubscribeAndClose();
    }

    // Rates and conversion
    getRates() {
        fetch(EXCHANGE_URL)
            .then(res => res.json())
            .then(rates => this.setState({ rates }))
            .catch(e => {
                console.error('Error getting exchange rates: ', e);
            });
    }
    convertToRate(satoshiValue) {
        const
            btc = satoshiValue / SATOSHI_PER_BTC,
            rate = this.state.rates[this.props.currency || DEFAULT_CURRENCY];

        return rate
            ? (rate.symbol + (btc * rate.last).toFixed(2) )
            : btc + 'BTC';
    }
    renderPoint(input) {
        const
            value = this.convertToRate(input),
            x = Math.floor(Math.random() * this.board.current.offsetWidth),
            y = Math.floor(Math.random() * this.board.current.offsetHeight);

        return { value, x, y };
    }

    // Socket Actions
    unsubscribeAndClose() {
        console.log('Unsubscribing from bitcoin transactions');
        this.sendData({
            op: 'unconfirmed_unsub'
        });
        this.socket.close();
    }
    subscribe() {
        console.log('Subscribing to bitcoin transactions');
        this.sendData({
            op: 'unconfirmed_sub'
        });
    }
    sendData(data) {
        try {
            this.socket.send(JSON.stringify(data));
        }
        catch (e) {
            console.log('Error: ', e);
            this.unsubscribeAndClose();
        }
    }
    receiveData(event) {
        let data = {};
        try {
            data = JSON.parse(event.data);
            if (data.x && Array.isArray(data.x.out)) {
                const values = data.x.out.map( ({ value }) => this.renderPoint(value) );

                // if over limit, remove several values so we don't need to keep shifting array
                this.setState({
                    data: [
                        ...(this.state.data.length > this.props.maxResults
                            ? this.state.data.slice(9)
                            : this.state.data),
                        ...values
                    ]
                })
            }
        }
        catch (e) {
            console.log('Error:', e);
            this.unsubscribeAndClose();
        }
    }

    render() {
        return (
            <div className='board' ref={this.board}>
                {
                    this.state.data.length > 0 && (
                        this.state.data.map( ({value, x, y}, i) => (
                            <span key={i} style={ {left: x, top: y} } className='value'>
                                {value}
                            </span>
                        ))
                    )
                }
            </div>
        )
    }
}

StreamViewer.propTypes = {
    currency: PropTypes.string.isRequired,
    maxResults: PropTypes.number.isRequired
};

export default StreamViewer;