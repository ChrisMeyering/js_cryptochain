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
        });
        this.chain.push(newBlock);
    }

    //validate chain
    static isValidChain(chain) {
        //verify that first block is genesis block
        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
            // console.error('Chain must start with genesis block');
            return false;
        }
        for (let i = 1; i < chain.length; i++) {
            if (Math.abs(chain[i].difficulty - chain[i - 1].difficulty) !== 1) {
                // console.error(`Block #${i} contains jumped difficulty`);
                return false;
            }
            if (!Block.isValidBlock(chain[i], chain[i - 1].hash)) {
                // console.error(`^--in block #${i} of chain`);
                return false;
            }
        }
        return true;
    }

    replaceChain(newChain) {
        if (newChain.length <= this.chain.length) {
            console.error('Failed to replace chain: original chain is longer');
        }
        if (Blockchain.isValidChain(newChain)) {
            this.chain = newChain;
        } else {
            console.error('Failed to replace chain: chain contains invalid block(s)');
        }
    }
}

module.exports = Blockchain;