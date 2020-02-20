const Blockchain = require('../../src/blockchain');
const Block = require('../../src/blockchain/block');
const { cryptoHash } = require('../../src/util');

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
                newChain.addBlock({ data: 'Bears are big' });
                newChain.addBlock({ data: 'Raccoons are cool' });
                newChain.addBlock({ data: 'Sunks stink' });
            });

            describe('when the new chain is invalid', () => {
                it('does not replace the chain', () => {
                    const errorMock = jest.fn();
                    global.console.error = errorMock;
                    newChain.chain[2].data = 'Raccoons are not cool';
                    blockchain.replaceChain(newChain.chain);
                    expect(blockchain.chain).toEqual(originalChain);
                    expect(errorMock).toHaveBeenCalled();
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