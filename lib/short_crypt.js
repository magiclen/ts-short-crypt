"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const long_1 = __importDefault(require("long"));
const hi_base32_1 = __importDefault(require("hi-base32"));
const crc64_we_1 = __importDefault(require("./crc64_we"));
const crc8_cdma_1 = __importDefault(require("./crc8_cdma"));
const functions_1 = require("./functions");
const base64 = require("hi-base64");
class ShortCrypt {
    hashedKey;
    keySumRev;
    constructor(key) {
        const data = functions_1.stringToUtf8ByteArray(key);
        const crc = new crc64_we_1.default();
        crc.digest(data);
        this.hashedKey = crc.getByteArray();
        let keySum = long_1.default.UZERO;
        data.forEach((n) => {
            keySum = keySum.add(n);
        });
        this.keySumRev = functions_1.reverseU64(keySum);
    }
    encrypt(data) {
        if (typeof data === "string") {
            data = functions_1.stringToUtf8ByteArray(data);
        }
        const len = data.length;
        const crc8 = new crc8_cdma_1.default();
        crc8.digest(data);
        const hashedValue = crc8.getNumber();
        const base = hashedValue % 32;
        const encrypted = [];
        let m = base;
        let sum = long_1.default.fromNumber(base, true);
        const self = this;
        data.forEach((d, i) => {
            let offset = self.hashedKey[i % 8] ^ base;
            let v = d ^ offset;
            encrypted.push(v);
            m ^= v;
            sum = sum.add(long_1.default.fromNumber(v, true));
        });
        const crc64 = new crc64_we_1.default();
        crc64.digest([m]);
        crc64.digest(sum.toBytesBE());
        const hashedVec = crc64.getByteArray();
        const path = [];
        for (let i = 0; i < len; ++i) {
            let index = i % 8;
            path.push((hashedVec[index] ^ this.hashedKey[index]) % len);
        }
        path.forEach((p, i) => {
            if (p === i) {
                return;
            }
            let t = encrypted[i];
            encrypted[i] = encrypted[p];
            encrypted[p] = t;
        });
        return {
            base: base,
            body: encrypted,
        };
    }
    decrypt(baseOrCipher, body) {
        let base;
        if (typeof baseOrCipher === "object") {
            body = baseOrCipher.body;
            base = baseOrCipher.base;
        }
        else {
            base = baseOrCipher;
        }
        if (base < 0 || base > 31) {
            return false;
        }
        const decrypted = [];
        const data = body;
        const len = data.length;
        let m = base;
        let sum = long_1.default.fromNumber(base, true);
        data.forEach((v) => {
            m ^= v;
            sum = sum.add(long_1.default.fromNumber(v, true));
        });
        const crc = new crc64_we_1.default();
        crc.digest([m]);
        crc.digest(sum.toBytesBE());
        const hashedVec = crc.getByteArray();
        const path = [];
        for (let i = 0; i < len; ++i) {
            let index = i % 8;
            path.push((hashedVec[index] ^ this.hashedKey[index]) % len);
        }
        const pathLenDec = path.length - 1;
        path.reverse().forEach((p, i) => {
            i = pathLenDec - i;
            if (p === i) {
                return;
            }
            let t = data[i];
            data[i] = data[p];
            data[p] = t;
        });
        const self = this;
        data.forEach((d, i) => {
            let offset = self.hashedKey[i % 8] ^ base;
            decrypted.push(d ^ offset);
        });
        return decrypted;
    }
    encryptToURLComponent(data) {
        if (typeof data === "string") {
            data = functions_1.stringToUtf8ByteArray(data);
        }
        const cipher = this.encrypt(data);
        const base = functions_1.u8toString64(cipher.base);
        const encrypted = cipher.body;
        let baseChar = String.fromCharCode(base);
        const result = base64.encode(encrypted).replace(/[+/]/g, (m0) => {
            return m0 === "+" ? "-" : "_";
        }).replace(/=/g, "");
        const resultArray = functions_1.stringToUtf8ByteArray(result);
        const len = resultArray.length;
        let sum = long_1.default.fromNumber(base);
        resultArray.forEach((n) => {
            sum = sum.add(long_1.default.fromNumber(n, true));
        });
        const baseIndex = this.keySumRev.xor(sum).mod(len + 1).toNumber();
        return result.substring(0, baseIndex) + baseChar + result.substring(baseIndex, len);
    }
    descryptURLComponent(urlComponent) {
        const bytes = functions_1.stringToUtf8ByteArray(urlComponent);
        const len = bytes.length;
        if (len < 1) {
            return false;
        }
        let sum = long_1.default.UZERO;
        bytes.forEach((n) => {
            sum = sum.add(long_1.default.fromNumber(n, true));
        });
        let baseIndex = this.keySumRev.xor(sum).mod(len).toNumber();
        let base = functions_1.string64toU8(bytes[baseIndex]);
        if (base < 0 || base > 31) {
            return false;
        }
        let encryptedBase64Url = urlComponent.slice(0, base) + urlComponent.slice(baseIndex + 1, len);
        let encrypted = base64.decode.bytes(encryptedBase64Url);
        return this.decrypt(base, encrypted);
    }
    encryptToQRCodeAlphanumeric(data) {
        if (typeof data === "string") {
            data = functions_1.stringToUtf8ByteArray(data);
        }
        const cipher = this.encrypt(data);
        const base = functions_1.u8toString32(cipher.base);
        const encrypted = cipher.body;
        const baseChar = String.fromCharCode(base);
        const result = hi_base32_1.default.encode(encrypted).replace(/=/g, "");
        const resultArray = functions_1.stringToUtf8ByteArray(result);
        const len = resultArray.length;
        let sum = long_1.default.fromNumber(base, true);
        resultArray.forEach((n) => {
            sum = sum.add(long_1.default.fromNumber(n, true));
        });
        let baseIndex = this.keySumRev.xor(sum).mod(len + 1).toNumber();
        return result.substring(0, baseIndex) + baseChar + result.substring(baseIndex, len);
    }
    decryptQRCodeAlphanumeric(qrCodeAlphanumeric) {
        const bytes = functions_1.stringToUtf8ByteArray(qrCodeAlphanumeric);
        const len = bytes.length;
        if (len < 1) {
            return false;
        }
        let sum = long_1.default.UZERO;
        bytes.forEach((n) => {
            sum = sum.add(long_1.default.fromNumber(n, true));
        });
        const baseIndex = this.keySumRev.xor(sum).mod(len).toNumber();
        const base = functions_1.string32toU8(bytes[baseIndex]);
        if (base < 0 || base > 31) {
            return false;
        }
        const encryptedBase32 = qrCodeAlphanumeric.slice(0, baseIndex) + qrCodeAlphanumeric.slice(baseIndex + 1, len);
        let encrypted = hi_base32_1.default.decode.asBytes(encryptedBase32);
        return this.decrypt(base, encrypted);
    }
}
exports.default = ShortCrypt;
module.exports = ShortCrypt;
