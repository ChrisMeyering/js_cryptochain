const Blockchain = require('../../src/blockchain');
const Block = require('../../src/blockchain/block');
const { cryptoHash } = require('../../src/util');
const Wallet = require('../../src/wallet');
const Transaction = require('../../src/wallet/transaction');
describe('Blockchain', () => {
    const blockchain = new Blockchain();

    it('contains a `chain` Array instance', () => {
        expect(blockchain.chain instanceof Array).toBe(true);
    });
    it('starts with the genesis block', () => {
        expect(blockchain.chain[0]).toEqual(Block.genesis());
    });
    it('adds a new block to the chain', () => {
        const newData = 'new transaction';
        blockchain.addBlock({ data: newData });

        expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData);
    });
});

describe('Blockchain', () => {
    describe('isValidChain()', () => {
        let blockchain = null;
        beforeEach(() => {
            blockchain = new Blockchain();
        });

        describe('when the chain does not start with the genesis block', () => {
            it('returns false', () => {
                blockchain.chain[0] = { data: 'fake-geneis' };
                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
            });
        });

        describe('when the chain starts with the genesis block and has multiple blocks', () => {
            beforeEach(() => {
                blockchain.addBlock({ data: 'Bears are big' });
                blockchain.addBlock({ data: 'Raccoons are cool' });
                blockchain.addBlock({ data: 'Sunks stink' });
            });

            describe('and a `lastHash` reference has changed', () => {
                it('returns false', () => {
                    blockchain.chain[2].lastHash = 'broken-lastHash';
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain contains a block with a jumped difficulty', () => {
                it('returns false', () => {
                    const lastBlock = blockchain.chain[blockchain.chain.length - 1];
                    const { lastHash } = lastBlock;
                    const timestamp = Date.now;
                    const nonce = 0;
                    const data = [];
                    const difficulty = lastBlock.difficulty + 15;
                    const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, data);
                    const badBlock = new Block({
                        timestamp,
                        nonce,
                        lastHash,
                        hash,
                        difficulty,
                        data
                    });
                    blockchain.chain.push(badBlock);
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain contains a block with an invalid field', () => {
                it('returns false', () => {
                    blockchain.chain[2].data = 'Raccoons are not cool';
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain contains a block where the difficulty constraint is violated', () => {
                it('returns false', () => {
                    blockchain = new Blockchain();
                    const lastBlock = blockchain.chain[blockchain.chain.length - 1];
                    const lastHash = lastBlock.hash;
                    const timestamp = new Date(2020, 1, 1);
                    const nonce = 0;
                    const data = [];
                    const difficulty = lastBlock.difficulty + 1;
                    const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, data);
                    const badBlock = new Block({
                        timestamp,
                        nonce,
                        lastHash,
                        hash,
                        difficulty,
                        data
                    });
                    blockchain.chain.push(badBlock);
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain does not contain any invalid blocks', () => {
                it('returns true', () => {
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
                });
            });
        });
    });
});

describe('Blockchain', () => {
    describe('replaceChain()', () => {
        let blockchain, newChain, originalChain;

        beforeEach(() => {
            blockchain = new Blockchain();
            newChain = new Blockchain();
            originalChain = blockchain.chain;
        });

        describe('when the new chain is not longer', () => {
            it('does not replace the chain', () => {
                const errorMock = jest.fn();
                global.console.error = errorMock;
                newChain.chain[0] = { data: 'new chain' };
                blockchain.replaceChain(newChain.chain);
                expect(blockchain.chain).toEqual(originalChain);
                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('when the new chain is longer', () => {
            beforeEach(() => {
                const wallet = new Wallet();
                const transaction1 = wallet.createTransaction({
                    recipient: new Wallet().publicKey,
                    amount: 65
                });
                const transaction2 = wallet.createTransaction({
                    recipient: new Wallet().publicKey,
                    amount: 115
                });
                const transaction3 = wallet.createTransaction({
                    recipient: new Wallet().publicKey,
                    amount: 10
                });
                const rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet });

                newChain.addBlock({ data: [
                    transaction1,
                    rewardTransaction
                ] });
                newChain.addBlock({ data: [
                    transaction2,
                    rewardTransaction
                ] });
                newChain.addBlock({ data: [
                    transaction3,
                    rewardTransaction
                ] });
            });

            describe('when the new chain is invalid', () => {
                it('does not replace the chain', () => {
                    const errorMock = jest.fn();
                    const actualError = global.console.eror;
                    global.console.error = errorMock;
                    newChain.chain[2].data = new Wallet().createTransaction({
                        recipient: new Wallet().publicKey,
                        amount: 10
                    });
                    blockchain.replaceChain(newChain.chain);
                    expect(blockchain.chain).toEqual(originalChain);
                    expect(errorMock).toHaveBeenCalled();
                    global.console.error = actualError;
                });
            });

            describe('when the new chain is valid', () => {
                it('replaces the chain', () => {
                    blockchain.replaceChain(newChain.chain);
                    expect(blockchain).toEqual(newChain);
                });
            });
        });
    });
});

describe('Blockchain', () => {
    describe('validTransactionData()', () => {
        let blockchain, newBlockchain, rewardTransaction, transaction, wallet;

        beforeEach(() => {
            blockchain = new Blockchain();
            newBlockchain = new Blockchain();
            wallet = new Wallet();
            transaction = wallet.createTransaction({
                recipient: new Wallet().publicKey,
                amount: 65
            });
            rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet });
        });

        describe('when the transaction data is invalid', () => {
            let errorMock;
            const actualError = global.console.error;
            beforeEach(() => {
                errorMock = jest.fn();
                global.console.error = errorMock;
            });

            afterEach(() => {
                expect(blockchain.validTransactionData({ chain: newBlockchain.chain })).toBe(false);
                expect(errorMock).toHaveBeenCalled();
                global.console.error = actualError;
            });

            /*
             * describe('it contains no reward', () => {
             * });
             */
            describe('it contains multiple rewards', () => {
                it('returns false and logs an error', () => {
                    newBlockchain.addBlock({
                        data: [
                            transaction,
                            rewardTransaction,
                            rewardTransaction
                        ]
                    });
                });
            });

            describe('the transaction contains at least one malformed outputMap', () => {
                describe('and the malformed transaction is not a reward transaction', () => {
                    it('returns false and logs an error', () => {
                        transaction.outputMap[wallet.publicKey] = 999999;
                        newBlockchain.addBlock({
                            data: [
                                transaction,
                                rewardTransaction
                            ]
                        });
                    });
                });

                describe('and the malformed transaction is a reward transaction ', () => {
                    it('returns false and logs an error', () => {
                        rewardTransaction.outputMap[wallet.publicKey] = 1000;
                        newBlockchain.addBlock({
                            data: [
                                transaction,
                                rewardTransaction
                            ]
                        });
                    });
                });
            });

            describe('the transaction contains at least one malformed input', () => {
                it('returns false and logs an error', () => {
                    wallet.balance = 9000;
                    const outputMap = {
                        [wallet.publicKey]: 8900,
                        fooRecipient: 100
                    };
                    const evilTransaction = {
                        outputMap,
                        input: {
                            timestamp: Date.now(),
                            signature: wallet.sign(outputMap),
                            amount: wallet.balance,
                            address: wallet.publicKey
                        }
                    };
                    newBlockchain.addBlock({
                        data: [
                            transaction,
                            evilTransaction,
                            rewardTransaction
                        ]
                    });
                });
            });

            describe('it contains duplicate transactions', () => {
                it('returns false and logs an error', () => {
                    newBlockchain.addBlock({
                        data: [
                            transaction,
                            transaction,
                            rewardTransaction
                        ]
                    });
                });
            });
        });

        describe('when the transaction data is valid', () => {
            it('returns true', () => {
                newBlockchain.addBlock({
                    data: [
                        transaction,
                        rewardTransaction
                    ]
                });
                expect(blockchain.validTransactionData({ chain: newBlockchain.chain })).toBe(true);
            });
        });

    });
});