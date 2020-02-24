const { STARTING_BALANCE } = require('../config/wallet');
const { ec, cryptoHash } = require('../util');
const Transaction = require('./transaction');

class Wallet {

    constructor() {
        this.balance = STARTING_BALANCE;
        this.keyPair = ec.genKeyPair();
        this.publicKey = this.keyPair.getPublic().encode('hex');
    }

    sign(data) {
        return this.keyPair.sign(cryptoHash(data));
    }

    createTransaction({ recipient, amount, chain }) {
        if (chain) {
            this.balance = Wallet.calculateBalance({
                chain,
                address: this.publicKey
            });
        }
        if (this.publicKey === recipient) {
            throw new Error(`Sender and recipient have the same address: ${recipient}`);
        }
        if (amount > this.balance) {
            throw new Error('Amount exceeds balance');
        }
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }
        return new Transaction({
            senderWallet: this,
            recipient,
            amount
        });
    }

    static calculateBalance({ chain, address }) {
        let hasConductedTransaction = false;
        let outputsTotal = 0;
        for (let i = chain.length - 1; i > 0; i--) {
            const block = chain[i];
            for (const transaction of block.data) {
                if (transaction.input.address === address) {
                    hasConductedTransaction = true;
                }
                outputsTotal += transaction.outputMap[address] || 0;
            }
            if (hasConductedTransaction) {
                break;
            }
        }
        if (hasConductedTransaction) {
            return outputsTotal;
        }
        return STARTING_BALANCE + outputsTotal;
    }
}

module.exports = Wallet;