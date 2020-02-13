const Block = require('./block');

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
            if (Math.abs(chain[i].difficulty - chain[i-1].difficulty) !== 1) {
                return false;
            }
            if (!Block.isValidBlock(chain[i], chain[i - 1].hash)) {
                return false;
            }
        }
        return true;
    }

    replaceChain(newChain) {
        if (newChain.length > this.chain.length && Blockchain.isValidChain(newChain)) {
            this.chain = newChain;
        }
    }
}

module.exports = Blockchain;