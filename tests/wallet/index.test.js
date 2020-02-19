const Wallet = require('../../src/wallet');
const Transaction = require('../../src/wallet/transaction');
const { verifySignature } = require('../../src/util');

describe('Wallet', () => {
    const wallet = new Wallet();

    it('has a `balance`', () => {
        expect(wallet).toHaveProperty('balance');
    });

    it('has a `publicKey`', () => {
        expect(wallet).toHaveProperty('publicKey');
    });

    it('has a `keyPair', () => {
        expect(wallet).toHaveProperty('keyPair');
    });

    it('signs data', () => {
        const data = 'dummy data';
        expect(verifySignature({
            signature: wallet.sign(data),
            publicKey: wallet.publicKey,
            data
        })).toBe(true);
    });
});

describe('Wallet', () => {
    describe('createTransaction()', () => {
        describe('when the amount exceeds the balance', () => {
            it('throws an error', () => {
                const wallet = new Wallet();
                expect(() => wallet.createTransaction({
                    recipient: 'foo',
                    amount: 999999
                })).toThrow('Amount exceeds balance');
            });
        });

        describe('when the amount is valid', () => {
            const amount = 50;
            const recipient = 'foo';
            const wallet = new Wallet();
            const transaction = wallet.createTransaction({
                recipient,
                amount
            });
            it('creates an instance of `Transaction`', () => {
                expect(transaction instanceof Transaction).toBe(true);
            });

            it('matches the transaction input with the wallet', () => {
                expect(transaction.input.address).toEqual(wallet.publicKey);
            });

            it('outputs the amount to the recipient', () => {
                expect(transaction.outputMap[recipient]).toEqual(amount);
            });
        });
    });
});