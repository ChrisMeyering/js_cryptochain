const MINE_RATE = 2000;
const INITIAL_DIFFICULTY = 7;
const GENESIS_DATA = {
    timestamp: 1,
    nonce: 0,
    lastHash: 'none',
    hash: 'genesis',
    difficulty: INITIAL_DIFFICULTY,
    data: []
};

module.exports = {
    MINE_RATE,
    GENESIS_DATA
};