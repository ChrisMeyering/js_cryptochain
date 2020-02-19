const Wallet = require('../../src/wallet');
const { verifySignature } = require('../../src/util');

describe('verifySignature()', () => {
    const wallet = new Wallet();
    const data = 'some data';

    it('rejects an invalid signature', () => {
        expect(verifySignature({
            signature: new Wallet().sign(data),
            publicKey: wallet.publicKey,
            data
        })).toBe(false);
    });

    it('accepts a valid signature', () => {
        expect(verifySignature({
            signature: wallet.sign(data),
            publicKey: wallet.publicKey,
            data
        })).toBe(true);
    });
});