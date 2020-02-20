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
});