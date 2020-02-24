const Transaction = require('../../src/wallet/transaction');
const Wallet = require('../../src/wallet');
const { verifySignature } = require('../../src/util');
const { MINING_REWARD, REWARD_INPUT } = require('../../src/config/wallet');

const setup = () => {
    const senderWallet = new Wallet();
    const recipient = new Wallet().publicKey;
    const amount = 50;
    const transaction = new Transaction({
        senderWallet,
        recipient,
        amount
    });
    return {
        transaction,
        senderWallet,
        recipient,
        amount
    };
};

const getErrorMock = () => {
    const errorMock = jest.fn();
    global.console.error = errorMock;
    return errorMock;
};


describe('Transaction', () => {
    const { transaction, senderWallet, recipient, amount } = setup();

    it('has an `id`', () => {
        expect(transaction).toHaveProperty('id');
    });

    it('has an `outputMap`', () => {
        expect(transaction).toHaveProperty('outputMap');
    });

    it('has an `input`', () => {
        expect(transaction).toHaveProperty('input');
    });

    describe('outputMap', () => {
        it('contains the amount to the recipient', () => {
            expect(transaction.outputMap[recipient]).toEqual(amount);
        });

        it('contains the remaining balance for the `senderWallet`', () => {
            expect(transaction.outputMap[senderWallet.publicKey]).
                toEqual(senderWallet.balance - amount);
        });
    });

    describe('input', () => {
        it('has a `timestamp`', () => {
            expect(transaction.input).toHaveProperty('timestamp');
        });

        it('sets the `amount` to the `senderWallet` `balance`', () => {
            expect(transaction.input.amount).toEqual(senderWallet.balance);
        });

        it('sets the `address` to the `senderWallet` `publicKey`', () => {
            expect(transaction.input.address).toEqual(senderWallet.publicKey);
        });

        it('signs the input', () => {
            expect(verifySignature({
                signature: transaction.input.signature,
                publicKey: senderWallet.publicKey,
                data: transaction.outputMap
            })).toBe(true);
        });
    });
});


describe('Transaction', () => {
    describe('isValidTransaction()', () => {
        describe('when the transaction is valid', () => {
            it('returns true', () => {
                const { transaction } = setup();
                expect(Transaction.isValidTransaction(transaction)).toBe(true);
            });
        });

        describe('when the transaction is invalid', () => {
            let errorMock;
            beforeEach(() => {
                errorMock = getErrorMock();
            });
            describe('and a outputMap value is invalid', () => {
                it('logs error and returns false', () => {
                    const { transaction, senderWallet } = setup();
                    transaction.outputMap[senderWallet.publicKey] = 999999;
                    expect(Transaction.isValidTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            describe('and the input signature is invalid', () => {
                it('logs error and returns false', () => {
                    const { transaction } = setup();
                    transaction.input.signature = new Wallet().sign('data');
                    expect(Transaction.isValidTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });

        });
    });
});

describe('Transaction', () => {
    describe('update()', () => {
        describe('and the amount is invalid', () => {
            describe('when the amount exceeds wallet balance', () => {
                it('throws and error', () => {
                    const { transaction, senderWallet, recipient } = setup();
                    expect(() => transaction.update({
                        senderWallet,
                        recipient,
                        amount: 999999
                    })).toThrow('Amount exceeds balance');
                });
            });
            describe('when the amount is not positive', () => {
                it('throws an error', () => {
                    const { transaction, senderWallet, recipient } = setup();
                    expect(() => transaction.update({
                        senderWallet,
                        recipient,
                        amount: -10
                    })).toThrow('Amount must be positive');
                });
            });
            describe('when the `recipient` address equals `senderWallet.publicKey`', () => {
                it('throws an error', () => {
                    const { transaction, senderWallet } = setup();
                    expect(() => transaction.update({
                        senderWallet,
                        recipient: senderWallet.publicKey,
                        amount: 500
                    })).toThrow(`Sender and recipient have the same address: ${senderWallet.publicKey}`);
                });
            });
        });

        describe('and the amount is valid', () => {
            const { transaction, senderWallet, amount } = setup();
            const originalSignature = transaction.input.signature;
            const nextAmount = amount;
            const nextRecipient = new Wallet().publicKey;
            const originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
            transaction.update({
                senderWallet,
                recipient: nextRecipient,
                amount: nextAmount
            });


            it('outputs the amount to the next recipient', () => {
                expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);
            });

            it('subtracts the amount from the sender output amount', () => {
                expect(transaction.outputMap[senderWallet.publicKey]).
                    toEqual(originalSenderOutput - nextAmount);
            });

            it('maintains a total output that matches the input amount', () => {
                expect(Object.values(transaction.outputMap).reduce((total, outputAmount) => total + outputAmount)).
                    toEqual(transaction.input.amount);

            });

            it('re-signs the transaction', () => {
                expect(transaction.input.signature).not.toEqual(originalSignature);
            });

            it('updated transaction is valid', () => {
                expect(Transaction.isValidTransaction(transaction)).toBe(true);
            });
        });
    });
});

describe('Transaction', () => {
    describe('update()', () => {
        describe('and the amount is valid', () => {
            describe('and the update targets the same recipient', () => {
                const { transaction, senderWallet, amount } = setup();
                const nextAmount = amount;
                const nextRecipient = new Wallet().publicKey;
                const originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
                transaction.update({
                    senderWallet,
                    recipient: nextRecipient,
                    amount: nextAmount
                });
                const addedAmount = 80;
                transaction.update({
                    senderWallet,
                    recipient: nextRecipient,
                    amount: addedAmount
                });

                it('adds to the recipient amount', () => {
                    expect(transaction.outputMap[nextRecipient]).
                        toEqual(nextAmount + addedAmount);
                });

                it('subtracts the amount from the original sender output amount', () => {
                    expect(transaction.outputMap[senderWallet.publicKey]).
                        toEqual(originalSenderOutput - nextAmount - addedAmount);
                });
            });
        });
    });
});

describe('Transactoin', () => {
    describe('rewardTransaction()', () => {
        let minerWallet, rewardTransaction;

        beforeEach(() => {
            minerWallet = new Wallet();
            rewardTransaction = Transaction.rewardTransaction({ minerWallet });
        });

        it('creates a reward transaction with the reward input', () => {
            expect(rewardTransaction.input).toEqual(REWARD_INPUT);
        });

        it('creates one transaction for the miner with the `MINING_REWARD`', () => {
            expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD);
        });
    });
});