// const { Wallet, Transaction } = require('../../src/wallet');
const Wallet = require('../../src/wallet');
const Transaction = require('../../src/wallet/transaction');
const TransactionPool = require('../../src/wallet/transaction-pool');
const Blockchain = require('../../src/blockchain');

describe('TransactionPool', () => {
    let transaction, transactionPool;

    beforeEach(() => {
        transactionPool = new TransactionPool();
        transaction = new Transaction({
            senderWallet: new Wallet(),
            recipient: new Wallet().publicKey,
            amount: 50
        });
        transactionPool.setTransaction(transaction);
    });

    describe('setTransaction()', () => {
        it('adds a transaction', () => {
            expect(transactionPool.transactionMap[transaction.id]).
                toBe(transaction);
        });
    });

    describe('existingTransaction()', () => {
        it('returns an existing transaction given an `inputAddress`', () => {
            expect(transactionPool.existingTransaction({
                inputAddress: transaction.input.address
            })).toBe(transaction);
        });
        it('returns undefined if `inputAddress` does not match any existing transaction input', () => {
            expect(transactionPool.existingTransaction({
                inputAddress: 'fake address'
            })).toBeUndefined();
        });
    });

    describe('validTransactions()', () => {
        let validTransactions;
        beforeEach(() => {
            validTransactions = [];
            transactionPool = new TransactionPool();
            for (let i = 0; i < 6; i++) {
                transaction = new Transaction({
                    senderWallet: new Wallet(),
                    recipient: `recipient ${i}`,
                    amount: 30
                });

                if (i % 3 === 0) {
                    transaction.input.amount = 99999;
                } else if (i % 3 === 1) {
                    transaction.input.signature = new Wallet().sign('bad signature');
                } else {
                    validTransactions.push(transaction);
                }
                transactionPool.setTransaction(transaction);
            }
        });

        it('returns the valid transactions and logs errors for invalid transactions', () => {
            const errorMock = jest.fn();
            global.console.error = errorMock;
            expect(transactionPool.validTransactions()).toEqual(validTransactions);
            expect(errorMock).toHaveBeenCalled();
        });

    });

    describe('clear()', () => {
        it('clears the transactions', () => {
            transactionPool.clear();
            expect(transactionPool.transactionMap).toEqual({});
        });
    });

    describe('clearBlockchainTransactions', () => {
        it('clears the pool of any existing blockchain transactions', () => {
            const blockchain = new Blockchain();
            transactionPool = new TransactionPool();
            const expectedTransactionMap = {};
            for (let i = 0; i < 6; i++) {
                transaction = new Transaction({
                    senderWallet: new Wallet(),
                    recipient: `recipient ${i}`,
                    amount: 30
                });
                transactionPool.setTransaction(transaction);
                if (i % 2 === 0) {
                    blockchain.addBlock({
                        data: [transaction]
                    });
                } else {
                    expectedTransactionMap[transaction.id] = transaction;
                }
            }
            transactionPool.clearBlockchainTransactions({
                chain: blockchain.chain
            });

            expect(transactionPool.transactionMap).toEqual(expectedTransactionMap);
        });
    });
});