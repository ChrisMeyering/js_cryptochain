// const { Wallet, Transaction } = require('../../src/wallet');
const Wallet = require('../../src/wallet');
const Transaction = require('../../src/wallet/transaction');
const TransactionPool = require('../../src/wallet/transaction-pool');

describe('TransactionPool', () => {
    let transaction, transactionPool;

    beforeEach(() => {
        transactionPool = new TransactionPool();
        transaction = new Transaction({
            senderWallet: new Wallet(),
            recipient: new Wallet().publicKey,
            amount: 50
        });
    });

    describe('setTransaction()', () => {
        it('adds a transaction', () => {
            transactionPool.setTransaction(transaction);
            expect(transactionPool.transactionMap[transaction.id]).
                toBe(transaction);
        });
        

    });
});