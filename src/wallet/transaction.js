const uuid = require('uuid/v1');

const { verifySignature } = require('../util');

class Transaction {
    constructor({ senderWallet, recipient, amount }) {
        this.id = uuid();
        this.outputMap = Transaction.createOutputMap({
            senderWallet,
            recipient,
            amount
        });
        this.input = Transaction.createInput({
            senderWallet,
            outputMap: this.outputMap
        });
    }

    update({ senderWallet, recipient, amount }) {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }
        if (amount > this.outputMap[senderWallet.publicKey]) {
            throw new Error('Amount exceeds balance');
        }
        this.outputMap[recipient] = (this.outputMap[recipient] || 0) + amount;
        this.outputMap[senderWallet.publicKey] -= amount;
        this.input = Transaction.createInput({
            senderWallet,
            outputMap: this.outputMap
        });
    }

    static createOutputMap({ senderWallet, recipient, amount }) {
        const outputMap = {};
        outputMap[recipient] = amount;
        outputMap[senderWallet.publicKey] = senderWallet.balance - amount;
        return outputMap;
    }

    static createInput({ senderWallet, outputMap }) {
        return {
            timestamp: Date.now(),
            signature: senderWallet.sign(outputMap),
            amount: senderWallet.balance,
            address: senderWallet.publicKey
        };
    }

    static isValidTransaction(transaction) {
        const { input: { address, amount, signature }, outputMap } = transaction;
        const outputTotal = Object.values(outputMap).
            reduce((total, outputAmount) => total + outputAmount);
        if (amount !== outputTotal) {
            console.error(`Invalid transaction from ${address}`);
            return false;
        }
        if (!verifySignature({ signature,
            publicKey: address,
            data: outputMap })) {
            console.error(`Invalid signature from ${address}`);
            return false;
        }
        return true;
    }
}

module.exports = Transaction;