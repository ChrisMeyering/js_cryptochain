const Wallet = require('../../src/wallet');
const Transaction = require('../../src/wallet/transaction');
const Blockchain = require('../../src/blockchain');
const { verifySignature } = require('../../src/util');
const { STARTING_BALANCE } = require('../../src/config/wallet');

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

        describe('when the amount is negative', () => {
            it('throws an error', () => {
                const wallet = new Wallet();
                expect(() => wallet.createTransaction({
                    recipient: 'foo',
                    amount: -1
                })).toThrow('Amount must be positive');
            });
        });

        describe('when the `recipient` address equals `this.publicKey`', () => {
            it('throws an error', () => {
                const wallet = new Wallet();
                expect(() => wallet.createTransaction({
                    recipient: wallet.publicKey,
                    amount: 500
                })).toThrow(`Sender and recipient have the same address: ${wallet.publicKey}`);
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

            describe('and a chain is passed', () => {
                it('calls `Wallet.calculateBalance`', () => {
                    const calculateBalanceMock = jest.fn();
                    const originalCalculateBalance = Wallet.calculateBalance;
                    Wallet.calculateBalance = calculateBalanceMock;
                    wallet.createTransaction({
                        recipient: 'foo',
                        chain: new Blockchain().chain,
                        amount: 10
                    });
                    expect(calculateBalanceMock).toHaveBeenCalled();
                    Wallet.calculateBalance = originalCalculateBalance;
                });
            });
        });
    });
});

describe('Wallet', () => {
    describe('calculateBalance()', () => {
        let blockchain;
        const wallet = new Wallet();

        beforeEach(() => {
            blockchain = new Blockchain();
        });

        describe('and there are no outputs for the wallet', () => {
            it('returns the `STARTING_BALANCE`', () => {
                expect(Wallet.calculateBalance({
                    chain: blockchain.chain,
                    address: wallet.publicKey
                })).toEqual(STARTING_BALANCE);
            });
        });

        describe('and there are outputs for the wallet', () => {
            let transactions;

            beforeEach(() => {
                transactions = [];
                for (let i = 0; i < 4; i++) {
                    const amount = (i + 1) * 30;
                    let transaction;
                    if (i % 2 === 0) {
                        transaction = new Wallet().createTransaction({
                            recipient: wallet.publicKey,
                            amount
                        });
                    } else {
                        transaction = new Wallet().createTransaction({
                            recipient: 'other recipient',
                            amount
                        });
                    }
                    transactions.push(transaction);
                }
                blockchain.addBlock({
                    data: transactions
                });
            });

            it('adds the sum of all outputs to the wallet balance', () => {
                let expectedTotal = STARTING_BALANCE;
                for (const transaction of transactions) {
                    expectedTotal += transaction.outputMap[wallet.publicKey] || 0;
                }
                expect(Wallet.calculateBalance({
                    chain: blockchain.chain,
                    address: wallet.publicKey
                })).toEqual(expectedTotal);
            });
        });

        describe('and the wallet has made a transaction', () => {
            let recentTransaction;

            beforeEach(() => {
                recentTransaction = wallet.createTransaction({
                    recipient: 'foo-address',
                    amount: 30
                });
                blockchain.addBlock({
                    data: [recentTransaction]
                });
            });
            it('returns the output amount of the recent transaction', () => {
                expect(Wallet.calculateBalance({
                    chain: blockchain.chain,
                    address: wallet.publicKey
                })).toEqual(recentTransaction.outputMap[wallet.publicKey]);
            });

            describe('and there are outputs next to and after the recent transaction', () => {
                let nextBlockTransaction, sameBlockTransaction;
                beforeEach(() => {
                    recentTransaction = wallet.createTransaction({
                        recipient: 'later-foo-address',
                        amount: 60
                    });
                    sameBlockTransaction = Transaction.rewardTransaction({ minerWallet: wallet });
                    blockchain.addBlock({ data: [
                        recentTransaction,
                        sameBlockTransaction
                    ] });

                    nextBlockTransaction = new Wallet().createTransaction({
                        recipient: wallet.publicKey,
                        amount: 500
                    });

                    blockchain.addBlock({
                        data: [nextBlockTransaction]
                    });
                });

                it('includes the output amounts in the returned balance', () => {
                    expect(Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })).toEqual(recentTransaction.outputMap[wallet.publicKey] +
                                sameBlockTransaction.outputMap[wallet.publicKey] +
                                nextBlockTransaction.outputMap[wallet.publicKey]);
                });
            });
        });
    });
});