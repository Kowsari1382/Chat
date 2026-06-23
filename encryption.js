const crypto = require('crypto');

function GenerateKeyPair() {
    const Keys = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    })
    return { PublicKey: Keys.publicKey, PrivateKey: Keys.privateKey };
}

function encrypt(message, publicKey) {
    const encrypted = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        },
        Buffer.from(message, 'utf8')
    )
    return encrypted.toString('base64')
}

module.exports = {
    GenerateKeyPair,
    encrypt
}