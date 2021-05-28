import Long from "long";
import base32 from "hi-base32";

import Crc64We from "./crc64_we";
import Crc8Cdma from "./crc8_cdma";
import Cipher from "./cipher";

import {
    reverseU64,
    string64toU8,
    stringToUtf8ByteArray,
    u8toString64,
    u8toString32,
    string32toU8,
} from "./functions";

const base64 = require("hi-base64");

export default class ShortCrypt {
    private hashedKey: number[];

    private keySumRev: Long;

    constructor(key: string) {
        const data = stringToUtf8ByteArray(key);

        const crc = new Crc64We();

        crc.digest(data);

        this.hashedKey = crc.getByteArray();

        let keySum = Long.UZERO;

        data.forEach((n) => {
            keySum = keySum.add(n);
        });

        this.keySumRev = reverseU64(keySum);
    }

    encrypt(data: number[] | string): Cipher {
        if (typeof data === "string") {
            data = stringToUtf8ByteArray(data);
        }

        const len = data.length;

        const crc8 = new Crc8Cdma();

        crc8.digest(data);

        const hashedValue = crc8.getNumber();

        const base = hashedValue % 32;

        const encrypted: number[] = [];

        let m = base;
        let sum = Long.fromNumber(base, true);

        const self = this;

        data.forEach((d, i) => {
            let offset = self.hashedKey[i % 8] ^ base;

            let v = d ^ offset;

            encrypted.push(v);

            m ^= v;
            sum = sum.add(Long.fromNumber(v, true));
        });

        const crc64 = new Crc64We();

        crc64.digest([m]);
        crc64.digest(sum.toBytesBE());

        const hashedVec = crc64.getByteArray();

        const path = [];

        for (let i = 0;i < len;++i) {
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

    decrypt(base: number, body: number[]): number[] | false;

    decrypt(cipher: Cipher): number[] | false;

    decrypt(baseOrCipher: number | Cipher, body?: number[]) {
        let base: number;
        
        if (typeof baseOrCipher === "object") {
            body = baseOrCipher.body;
            base = baseOrCipher.base;
        } else {
            base = baseOrCipher;
        }

        if (base < 0 || base > 31) {
            return false;
        }

        const decrypted: number[] = [];

        const data = body!;
        const len = data.length;
        
        let m = base;
        let sum = Long.fromNumber(base, true);

        data.forEach((v) => {
            m ^= v;
            sum = sum.add(Long.fromNumber(v, true));
        });

        const crc = new Crc64We();

        crc.digest([m]);
        crc.digest(sum.toBytesBE());

        const hashedVec = crc.getByteArray();

        const path = [];

        for (let i = 0;i < len;++i) {
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

    encryptToURLComponent(data: number[] | string) {
        if (typeof data === "string") {
            data = stringToUtf8ByteArray(data);
        }

        const cipher = this.encrypt(data);

        const base = u8toString64(cipher.base);

        const encrypted = cipher.body;

        let baseChar = String.fromCharCode(base);

        const result = base64.encode(encrypted).replace(/[+/]/g, (m0: string) => {
            return m0 === "+" ? "-" : "_";
        }).replace(/=/g, "");

        const resultArray = stringToUtf8ByteArray(result);

        const len = resultArray.length;

        let sum = Long.fromNumber(base);

        resultArray.forEach((n) => {
            sum = sum.add(Long.fromNumber(n, true));
        });

        const baseIndex = this.keySumRev.xor(sum).mod(len + 1).toNumber();

        return result.substring(0, baseIndex) + baseChar + result.substring(baseIndex, len);
    }

    descryptURLComponent(urlComponent: string) {
        const bytes = stringToUtf8ByteArray(urlComponent);
    
        const len = bytes.length;

        if (len < 1) {
            return false;
        }

        let sum = Long.UZERO;

        bytes.forEach((n) => {
            sum = sum.add(Long.fromNumber(n, true));
        });

        let baseIndex = this.keySumRev.xor(sum).mod(len).toNumber();

        let base = string64toU8(bytes[baseIndex]);

        if (base < 0 || base > 31) {
            return false;
        }

        let encryptedBase64Url = urlComponent.slice(0, base) + urlComponent.slice(baseIndex + 1, len);

        let encrypted = base64.decode.bytes(encryptedBase64Url);

        return this.decrypt(base, encrypted);
    }

    encryptToQRCodeAlphanumeric(data: number[] | string) {
        if (typeof data === "string") {
            data = stringToUtf8ByteArray(data);
        }

        const cipher = this.encrypt(data);

        const base = u8toString32(cipher.base);

        const encrypted = cipher.body;

        const baseChar = String.fromCharCode(base);

        const result = base32.encode(encrypted).replace(/=/g, "");

        const resultArray = stringToUtf8ByteArray(result);
        
        const len = resultArray.length;

        let sum = Long.fromNumber(base, true);

        resultArray.forEach((n) => {
            sum = sum.add(Long.fromNumber(n, true));
        });

        let baseIndex = this.keySumRev.xor(sum).mod(len + 1).toNumber();

        return result.substring(0, baseIndex) + baseChar + result.substring(baseIndex, len);
    }

    decryptQRCodeAlphanumeric(qrCodeAlphanumeric: string) {
        const bytes = stringToUtf8ByteArray(qrCodeAlphanumeric);

        const len = bytes.length;

        if (len < 1) {
            return false;
        }

        let sum = Long.UZERO;

        bytes.forEach((n) => {
            sum = sum.add(Long.fromNumber(n, true));
        });

        const baseIndex = this.keySumRev.xor(sum).mod(len).toNumber();

        const base = string32toU8(bytes[baseIndex]);

        if (base < 0 || base > 31) {
            return false;
        }

        const encryptedBase32 = qrCodeAlphanumeric.slice(0, baseIndex) + qrCodeAlphanumeric.slice(baseIndex + 1, len);

        let encrypted = base32.decode.asBytes(encryptedBase32);

        return this.decrypt(base, encrypted);
    }
}

module.exports = ShortCrypt;
