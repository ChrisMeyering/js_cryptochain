const Block = require('./block');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');

const { REWARD_INPUT, MINING_REWARD } = require('../config/wallet');

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

    replaceChain(newChain, onSuccess) {
        const replaceFailed = (reason) => console.error(`Failed to replace chain: ${reason}`);

        if (newChain.length <= this.chain.length) {
            replaceFailed('the incoming chain must be longer');
        } else if (Blockchain.isValidChain(newChain) === false) {
            replaceFailed('the incoming chain contains invalid block(s)');
        } else if (!this.validTransactionData({ chain: newChain })) {
            replaceFailed('the incoming chain has invalid transaction data');
        } else {
            if (onSuccess) {
                onSuccess();
            }
            this.chain = newChain;
        }
    }

    validTransactionData({ chain }) {
        for (const block of chain) {
            let rewardTransactionCount = 0;
            const transactionSet = new Set();
            for (const transaction of block.data) {
                if (transaction.input.address === REWARD_INPUT.address) {
                    rewardTransactionCount += 1;
                    if (rewardTransactionCount > 1) {
                        console.error('Miner rewards exceed limit');
                        return false;
                    }
                    if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                        console.error('Miner reward amount is invalid');
                        return false;
                    }
                } else {
                    if (!Transaction.isValidTransaction(transaction)) {
                        console.error('Invalid transaction');
                        return false;
                    }
                    const trueBalance = Wallet.calculateBalance({
                        chain: this.chain,
                        address: transaction.input.address
                    });

                    if (transaction.input.amount !== trueBalance) {
                        console.error('Invalid input amount');
                        return false;
                    }

                    if (transactionSet.has(transaction)) {
                        console.error('Duplicate transaction found in block');
                        return false;
                    }
                    transactionSet.add(transaction);

                }
            }
        }
        return true;
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
}

module.exports = Blockchain;