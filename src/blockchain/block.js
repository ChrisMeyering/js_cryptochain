const hexToBinary = require('hex-to-binary');
const { GENESIS_DATA, MINE_RATE } = require('./config');
const cryptoHash = require('../utils/crypto-hash');

class Block {
    constructor({ timestamp, lastHash, hash, data, nonce, difficulty }) {
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.hash = hash;
        this.data = data;
        this.nonce = nonce;
        this.difficulty = difficulty;
    }

    static genesis() {
        return new this(GENESIS_DATA);
    }

    static mineBlock({ lastBlock, data }) {
        let hash, timestamp;
        const lastHash = lastBlock.hash;
        let { difficulty } = lastBlock;
        let nonce = 0;
        do {
            nonce += 1;
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty({ originalBlock: lastBlock,
                newTimestamp: timestamp });
            hash = cryptoHash(timestamp, nonce, lastHash, data, difficulty)
        } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));
        return new this({
            timestamp,
            nonce,
            lastHash,
            hash,
            difficulty,
            data
        });
    }

    static isValidBlock(block, lastBlockHash) {
        const { timestamp, nonce, lastHash, hash, difficulty, data } = block;
        //validate block's lastHash
        if (lastHash !== lastBlockHash) {
            return false;
        }
        //validate block's hash
        if (hash !== cryptoHash(data, timestamp, lastHash, nonce, difficulty)) {
            return false;
        }
        //validate block's difficulty constraint
        if (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty)) {
            return false
        }

        return true;
    }

    static adjustDifficulty({ originalBlock, newTimestamp }) {
        if (originalBlock.difficulty < 1) {
            return 1;
        }
        if (originalBlock.timestamp + MINE_RATE < newTimestamp) {
            return Math.max(originalBlock.difficulty - 1, 1);
        }
        return originalBlock.difficulty + 1;
    }
}

module.exports = Block;