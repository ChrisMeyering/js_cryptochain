const Block = require('../block');
const { GENESIS_DATA } = require('../config');
const cryptoHash = require('../crypto-hash');
describe('Block', () => {
    const timestamp = 'a-date';
    const lastHash = 'foo-hash';
    const hash = 'foo-lasthash';
    const data = [
        'blockchain',
        'data'
    ];
    const block = new Block({
        timestamp,
        lastHash,
        hash,
        data
    });

    it('has a `timestamp` property', () => {
        expect(block.timestamp).toEqual(timestamp);
    });

    it('has a `lastHash` property', () => {
        expect(block.lastHash).toEqual(lastHash);
    });

    it('has a `hash` property', () => {
        expect(block.hash).toEqual(hash);
    });

    it('has a `data` property', () => {
        expect(block.data).toEqual(data);
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
                toEqual(cryptoHash(minedBlock.timestamp, lastBlock.hash, data));
        });
    });
});