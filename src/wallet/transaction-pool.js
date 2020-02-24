const Transaction = require('./transaction');

class TransactionPool {
    constructor () {
        this.transactionMap = {};
    }

    setTransaction(transaction) {
        this.transactionMap[transaction.id] = transaction;
    }

    existingTransaction({ inputAddress }) {
        return Object.values(this.transactionMap).
            find((transaction) => transaction.input.address === inputAddress);
    }

    validTransactions() {
        return Object.values(this.transactionMap).
            filter((transaction) => Transaction.isValidTransaction(transaction));
    }

    clear() {
        this.transactionMap = {};
    }

    clearBlockchainTransactions({ chain }) {
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            for (const transaction of block.data) {
                if (this.transactionMap[transaction.id]) {
                    Reflect.deleteProperty(this.transactionMap, transaction.id);
                }
            }
        }
    }
}

module.exports = TransactionPool;