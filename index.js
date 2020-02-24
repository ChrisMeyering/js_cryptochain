const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');

const Blockchain = require('./src/blockchain');
const PubSub = require('./src/app/pubsub');
const TransactionPool = require('./src/wallet/transaction-pool');
const Wallet = require('./src/wallet');
const TransactionMiner = require('./src/app/transaction-miner');

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({
    transactionPool,
    blockchain
});

const transactionMiner = new TransactionMiner({
    wallet,
    transactionPool,
    pubsub,
    blockchain
});

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

app.use(bodyParser.json());

app.get('/api/blocks', (req, res) => {
    res.status(200).json(blockchain.chain);
});

app.post('/api/mine', (req, res) => {
    const { data } = req.body;
    blockchain.addBlock({ data });

    pubsub.broadcastChain();
    res.status(201).redirect('/api/blocks');
});

app.post('/api/transact', (req, res) => {
    const { recipient, amount } = req.body;
    if (wallet.publicKey === recipient) {
        return res.status(403).json({
            type: 'error',
            message: `Sender and recipient have the same address: ${wallet.publicKey}`
        });
    }
    let transaction = transactionPool.existingTransaction({
        inputAddress: wallet.publicKey
    });

    try {
        if (transaction) {
            transaction.update({
                senderWallet: wallet,
                recipient,
                amount
            });
        } else {
            transaction = wallet.createTransaction({
                recipient,
                chain: blockchain.chain,
                amount
            });
        }
    } catch (error) {
        return res.status(400).json({
            type: 'error',
            message: error.message
        });
    }
    transactionPool.setTransaction(transaction);

    pubsub.broadcastTransaction(transaction);
    return res.status(201).json({
        type: 'success',
        data: transaction
    });
});

app.get('/api/transaction-pool-map', (req, res) => {
    res.status(200).json(transactionPool.transactionMap);
});

app.get('/api/mine-transactions', (req, res) => {
    transactionMiner.mineTransactions();
    res.redirect('/api/blocks');
});

app.get('/api/wallet-info', (req, res) => {
    const address = wallet.publicKey;
    res.status(200).json({
        balance: Wallet.calculateBalance({
            chain: blockchain.chain,
            address
        }),
        address
    });
});

const syncChains = () => {
    request({
        url: `${ROOT_NODE_ADDRESS}/api/blocks`
    }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const rootChain = JSON.parse(body);
            console.log('replace chain on a sync with', rootChain);
            blockchain.replaceChain(rootChain);
        } else {
            console.log('error:', error);
        }
    });
};

const syncTransactions = () => {
    request({
        url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map`
    }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            transactionPool.transactionMap = JSON.parse(body);
            console.log('synced transactionPool map: ', transactionPool.transactionMap);
        } else {
            console.log('error:', error);
        }
    });
};

const syncWithRoot = () => {
    syncChains();
    syncTransactions();
};

let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = PEER_PORT || DEFAULT_PORT;

app.listen(PORT, () => {
    console.log(`listening at localhost:${PORT}`);
    if (PORT !== DEFAULT_PORT) {
        syncWithRoot();
    }
});