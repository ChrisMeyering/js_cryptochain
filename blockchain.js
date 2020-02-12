const Block = require('./block');
const cryptoHash = require('./crypto-hash');

class Blockchain {

    //initialize blockchain with genesis block
    constructor() {
        this.chain = [Block.genesis()];
    }

    //adds a new block containing `data` to the chain
    addBlock({ data }) {
        const newBlock = Block.mineBlock({
            lastBlock: this.chain[this.chain.length - 1],
            data
        })
        this.chain.push(newBlock);
    }

    //validate chain
    static isValidChain(chain) {
        //verify that first block is genesis block
        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
            return false;
        }
        for (let i = 1; i < chain.length; i++) {
            const { timestamp, lastHash, hash, data } = chain[i];
            //validate block's lastHash
            if (lastHash !== chain[i - 1].hash) {
                return false;
            }
            const expectedHash = cryptoHash(data, timestamp, lastHash);
            //validate block's hash
            if (hash !== expectedHash) {
                return false;
            }
        }
        return true;
    }
}

module.exports = Blockchain;