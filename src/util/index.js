const EC = require('elliptic').ec;

const cryptoHash = require('./crypto-hash');

const ec = new EC('secp256k1');

const verifySignature = ({ signature, publicKey, data }) => {
    const keyFromPublic = ec.keyFromPublic(publicKey, 'hex');
    return keyFromPublic.verify(cryptoHash(data), signature);
};

module.exports = {
    verifySignature,
    ec,
    cryptoHash
};