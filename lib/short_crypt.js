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
// eslint-disable-next-line @typescript-eslint/no-var-requires
const base64 = require("hi-base64");
class ShortCrypt {
    constructor(key) {
        const data = (0, functions_1.stringToUtf8ByteArray)(key);
        const crc = new crc64_we_1.default();
        crc.digest(data);
        this.hashedKey = crc.getByteArray();
        let keySum = long_1.default.UZERO;
        data.forEach((n) => {
            keySum = keySum.add(n);
        });
        this.keySumRev = (0, functions_1.reverseU64)(keySum);
    }
    encrypt(data) {
        if (typeof data === "string") {
            data = (0, functions_1.stringToUtf8ByteArray)(data);
        }
        const len = data.length;
        const crc8 = new crc8_cdma_1.default();
        crc8.digest(data);
        const hashedValue = crc8.getNumber();
        const base = hashedValue % 32;
        const encrypted = [];
        let m = base;
        let sum = long_1.default.fromNumber(base, true);
        data.forEach((d, i) => {
            const offset = this.hashedKey[i % 8] ^ base;
            const v = d ^ offset;
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
            const index = i % 8;
            path.push((hashedVec[index] ^ this.hashedKey[index]) % len);
        }
        path.forEach((p, i) => {
            if (p === i) {
                return;
            }
            const t = encrypted[i];
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
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
            const index = i % 8;
            path.push((hashedVec[index] ^ this.hashedKey[index]) % len);
        }
        const pathLenDec = path.length - 1;
        path.reverse().forEach((p, i) => {
            i = pathLenDec - i;
            if (p === i) {
                return;
            }
            const t = data[i];
            data[i] = data[p];
            data[p] = t;
        });
        data.forEach((d, i) => {
            const offset = this.hashedKey[i % 8] ^ base;
            decrypted.push(d ^ offset);
        });
        return decrypted;
    }
    encryptToURLComponent(data) {
        if (typeof data === "string") {
            data = (0, functions_1.stringToUtf8ByteArray)(data);
        }
        const cipher = this.encrypt(data);
        const base = (0, functions_1.u8toString64)(cipher.base);
        const encrypted = cipher.body;
        const baseChar = String.fromCharCode(base);
        const result = base64.encode(encrypted).replace(/[+/]/g, (m0) => {
            return m0 === "+" ? "-" : "_";
        }).replace(/=/g, "");
        const resultArray = (0, functions_1.stringToUtf8ByteArray)(result);
        const len = resultArray.length;
        let sum = long_1.default.fromNumber(base);
        resultArray.forEach((n) => {
            sum = sum.add(long_1.default.fromNumber(n, true));
        });
        const baseIndex = this.keySumRev.xor(sum).mod(len + 1).toNumber();
        return result.substring(0, baseIndex) + baseChar + result.substring(baseIndex, len);
    }
    decryptURLComponent(urlComponent) {
        const bytes = (0, functions_1.stringToUtf8ByteArray)(urlComponent);
        const len = bytes.length;
        if (len < 1) {
            return false;
        }
        let sum = long_1.default.UZERO;
        bytes.forEach((n) => {
            sum = sum.add(long_1.default.fromNumber(n, true));
        });
        const baseIndex = this.keySumRev.xor(sum).mod(len).toNumber();
        const base = (0, functions_1.string64toU8)(bytes[baseIndex]);
        if (base < 0 || base > 31) {
            return false;
        }
        const encryptedBase64Url = urlComponent.slice(0, baseIndex) + urlComponent.slice(baseIndex + 1, len);
        try {
            const encrypted = base64.decode.bytes(encryptedBase64Url);
            return this.decrypt(base, encrypted);
        }
        catch (_a) {
            return false;
        }
    }
    /**
     * @deprecated Should use `decryptURLComponent`.
     */
    descryptURLComponent(urlComponent) {
        return this.decryptURLComponent(urlComponent);
    }
    encryptToQRCodeAlphanumeric(data) {
        if (typeof data === "string") {
            data = (0, functions_1.stringToUtf8ByteArray)(data);
        }
        const cipher = this.encrypt(data);
        const base = (0, functions_1.u8toString32)(cipher.base);
        const encrypted = cipher.body;
        const baseChar = String.fromCharCode(base);
        const result = hi_base32_1.default.encode(encrypted).replace(/=/g, "");
        const resultArray = (0, functions_1.stringToUtf8ByteArray)(result);
        const len = resultArray.length;
        let sum = long_1.default.fromNumber(base, true);
        resultArray.forEach((n) => {
            sum = sum.add(long_1.default.fromNumber(n, true));
        });
        const baseIndex = this.keySumRev.xor(sum).mod(len + 1).toNumber();
        return result.substring(0, baseIndex) + baseChar + result.substring(baseIndex, len);
    }
    decryptQRCodeAlphanumeric(qrCodeAlphanumeric) {
        const bytes = (0, functions_1.stringToUtf8ByteArray)(qrCodeAlphanumeric);
        const len = bytes.length;
        if (len < 1) {
            return false;
        }
        let sum = long_1.default.UZERO;
        bytes.forEach((n) => {
            sum = sum.add(long_1.default.fromNumber(n, true));
        });
        const baseIndex = this.keySumRev.xor(sum).mod(len).toNumber();
        const base = (0, functions_1.string32toU8)(bytes[baseIndex]);
        if (base < 0 || base > 31) {
            return false;
        }
        const encryptedBase32 = qrCodeAlphanumeric.slice(0, baseIndex) + qrCodeAlphanumeric.slice(baseIndex + 1, len);
        try {
            const encrypted = hi_base32_1.default.decode.asBytes(encryptedBase32);
            return this.decrypt(base, encrypted);
        }
        catch (_a) {
            return false;
        }
    }
}
exports.default = ShortCrypt;
module.exports = ShortCrypt;
