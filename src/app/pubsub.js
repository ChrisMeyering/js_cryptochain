const redis = require('redis');

const CHANNELS = {
    TRANSACTION: 'TRANSACTION',
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN'
};

class PubSub {
    constructor({ blockchain, transactionPool }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;

        this.publisher = redis.createClient();
        this.subscriber = redis.createClient();

        this.subscribeToChannels();
        this.subscriber.on(
            'message',
            (channel, message) => this.handleMessage(channel, message)
        );
    }

    handleMessage(channel, message) {
        console.log(`Message received:\n\tChannel: ${channel}\n\tMessage: ${message}`);
        const parsedMessage = JSON.parse(message);
        switch (channel) {
        case CHANNELS.BLOCKCHAIN:
            this.blockchain.replaceChain(parsedMessage, () => {
                this.transactionPool.clearBlockchainTransactions({
                    chain: parsedMessage
                });
            });
            break;
        case CHANNELS.TRANSACTION:
            this.transactionPool.setTransaction(parsedMessage);
            break;
        default:
            break;
        }
    }

    subscribeToChannels() {
        Object.values(CHANNELS).forEach((channel) => {
            this.subscriber.subscribe(channel);
        });
    }

    publish({ channel, message }) {
        this.subscriber.unsubscribe(channel, () => {
            this.publisher.publish(channel, message, () => {
                this.subscriber.subscribe(channel);
            });
            console.log(`Message sent:\n\tChannel: ${channel}\n\tMessage: ${message}`);
        });
    }

    broadcastChain() {
        this.publish({
            message: JSON.stringify(this.blockchain.chain),
            channel: CHANNELS.BLOCKCHAIN
        });
    }

    broadcastTransaction(transaction) {
        this.publish({
            message: JSON.stringify(transaction),
            channel: CHANNELS.TRANSACTION
        });
    }
}

module.exports = PubSub;