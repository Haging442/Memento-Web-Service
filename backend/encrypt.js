const crypto = require("crypto");

const ALGO = "aes-256-gcm";
const KEY = crypto.randomBytes(32); // TODO: move to env later

function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);

    let enc = cipher.update(text, "utf8", "hex");
    enc += cipher.final("hex");

    const tag = cipher.getAuthTag().toString("hex");

    return {
        iv: iv.toString("hex"),
        tag,
        payload: enc
    };
}

module.exports = { encrypt };