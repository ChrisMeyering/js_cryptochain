const uuid = require('uuid/v1');

const { verifySignature } = require('../util');
const { MINING_REWARD, REWARD_INPUT } = require('../config/wallet');

class Transaction {
    constructor({ senderWallet, recipient, amount, outputMap, input }) {
        this.id = uuid();
        this.outputMap = outputMap || Transaction.createOutputMap({
            senderWallet,
            recipient,
            amount
        });
        this.input = input || Transaction.createInput({
            senderWallet,
            outputMap: this.outputMap
        });
    }

    update({ senderWallet, recipient, amount }) {
        if (senderWallet.publicKey === recipient) {
            throw new Error(`Sender and recipient have the same address: ${recipient}`);
        }
        if (amount > this.outputMap[senderWallet.publicKey]) {
            throw new Error('Amount exceeds balance');
        }
        if (amount <= 0) {
            throw new Error('Amount must be positive');
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

    static rewardTransaction({ minerWallet }) {
        return new Transaction({
            outputMap: { [minerWallet.publicKey]: MINING_REWARD },
            input: REWARD_INPUT
        });
    }
}

module.exports = Transaction;