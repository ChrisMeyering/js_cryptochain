const hexToBinary = require('hex-to-binary');

const Block = require('../../src/blockchain/block');
const { GENESIS_DATA, MINE_RATE } = require('../../src/config/blockchain');
const cryptoHash = require('../../src/util/crypto-hash');

describe('Block', () => {
    const timestamp = 'a-date';
    const lastHash = 'foo-hash';
    const hash = 'foo-lasthash';
    const data = [
        'blockchain',
        'data'
    ];
    const nonce = 1;
    const difficulty = 2;
    const block = new Block({
        timestamp,
        nonce,
        lastHash,
        hash,
        difficulty,
        data
    });

    it('has a `timestamp` property', () => {
        expect(block).toHaveProperty('timestamp');
        expect(block.timestamp).toEqual(timestamp);
    });

    it('has a `lastHash` property', () => {
        expect(block).toHaveProperty('lastHash');
        expect(block.lastHash).toEqual(lastHash);
    });

    it('has a `hash` property', () => {
        expect(block).toHaveProperty('hash');
        expect(block.hash).toEqual(hash);
    });

    it('has a `data` property', () => {
        expect(block).toHaveProperty('data');
        expect(block.data).toEqual(data);
    });

    it('has a `nonce` property', () => {
        expect(block).toHaveProperty('nonce');
        expect(block.nonce).toEqual(nonce);
    });

    it('has a `difficulty` property', () => {
        expect(block).toHaveProperty('difficulty');
        expect(block.difficulty).toEqual(difficulty);
    });
});

describe('Block', () => {
    describe('genesis()', () => {
        const genesisBlock = Block.genesis();

        it('returns a Block instance', () => {
            expect(genesisBlock instanceof Block).toBe(true);
        });

        it('contains genesis data', () => {
            expect(genesisBlock).toEqual(GENESIS_DATA);
        });
    });
});

describe('Block', () => {
    describe('mineBlock()', () => {
        const lastBlock = Block.genesis();
        const data = 'data to mine';
        const minedBlock = Block.mineBlock({ lastBlock,
            data });

        it('returns a Block instance', () => {
            expect(minedBlock instanceof Block).toBe(true);
        });

        it('sets the `lastHash` to be the `hash` of the lastBlock', () => {
            expect(minedBlock.lastHash).toEqual(lastBlock.hash);
        });

        it('sets the `data`', () => {
            expect(minedBlock.data).toEqual(data);
        });

        it('sets a `timestamp`', () => {
            expect(minedBlock.timestamp).not.toEqual(undefined);
        });

        it('creates a SHA-256 `hash` based on the proper inputs', () => {
            expect(minedBlock.hash).
                toEqual(cryptoHash(
                    minedBlock.timestamp,
                    minedBlock.nonce,
                    minedBlock.difficulty,
                    lastBlock.hash,
                    data
                ));
        });

        it('sets a `hash` that matches the difficulty criteria', () => {
            expect(hexToBinary(minedBlock.hash).substring(0, minedBlock.difficulty)).
                toEqual('0'.repeat(minedBlock.difficulty));
        });

        it('adjusts the difficulty', () => {
            const possibleResults = [
                lastBlock.difficulty + 1,
                lastBlock.difficulty - 1
            ];
            expect(possibleResults.includes(minedBlock.difficulty)).toBe(true);
        });
    });
});

describe('Block', () => {
    const timestamp = Date.now();
    const lastHash = 'foo-hash';
    const hash = 'foo-lasthash';
    const data = [
        'blockchain',
        'data'
    ];
    const nonce = 1;
    const difficulty = 2;
    const block = new Block({
        timestamp,
        nonce,
        lastHash,
        hash,
        difficulty,
        data
    });

    describe('adjustDifficulty()', () => {
        it('raises the difficulty for a quickly mined block', () => {
            expect(Block.adjustDifficulty({ originalBlock: block,
                newTimestamp: block.timestamp + MINE_RATE - 100 })).
                toEqual(block.difficulty + 1);
        });

        it('lowers the difficulty for a slowly mined block', () => {
            expect(Block.adjustDifficulty({ originalBlock: block,
                newTimestamp: block.timestamp + MINE_RATE + 100 })).
                toEqual(block.difficulty - 1);
        });

        it('has a lower limit of 1', () => {
            block.difficulty = -1;
            expect(Block.adjustDifficulty({ originalBlock: block })).toEqual(1);
        });
    });
});