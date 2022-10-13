import Long from "long";
import { base32, base64url } from "rfc4648";

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

        data.forEach((d, i) => {
            const offset = this.hashedKey[i % 8] ^ base;

            const v = d ^ offset;

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

    decrypt(base: number, body: number[]): number[] | false;

    decrypt(cipher: Cipher): number[] | false;

    decrypt(baseOrCipher: number | Cipher, body?: number[]): number[] | false {
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

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

    encryptToURLComponent(data: number[] | string): string {
        if (typeof data === "string") {
            data = stringToUtf8ByteArray(data);
        }

        const cipher = this.encrypt(data);

        const base = u8toString64(cipher.base);

        const encrypted = cipher.body;

        const baseChar = String.fromCharCode(base);

        const result = base64url.stringify(encrypted, { pad: false });

        const resultArray = stringToUtf8ByteArray(result);

        const len = resultArray.length;

        let sum = Long.fromNumber(base);

        resultArray.forEach((n) => {
            sum = sum.add(Long.fromNumber(n, true));
        });

        const baseIndex = this.keySumRev.xor(sum).mod(len + 1).toNumber();

        return result.substring(0, baseIndex) + baseChar + result.substring(baseIndex, len);
    }

    decryptURLComponent(urlComponent: string): number[] | false {
        const bytes = stringToUtf8ByteArray(urlComponent);

        const len = bytes.length;

        if (len < 1) {
            return false;
        }

        let sum = Long.UZERO;

        bytes.forEach((n) => {
            sum = sum.add(Long.fromNumber(n, true));
        });

        const baseIndex = this.keySumRev.xor(sum).mod(len).toNumber();

        const base = string64toU8(bytes[baseIndex]);

        if (base < 0 || base > 31) {
            return false;
        }

        const encryptedBase64Url = urlComponent.slice(0, baseIndex) + urlComponent.slice(baseIndex + 1, len);

        try {
            const encrypted = base64url.parse(encryptedBase64Url, { out: Array, loose: true }) as unknown as number[];

            return this.decrypt(base, encrypted);
        } catch {
            return false;
        }
    }

    /**
     * @deprecated Should use `decryptURLComponent`.
     */
    descryptURLComponent(urlComponent: string): number[] | false {
        return this.decryptURLComponent(urlComponent);
    }

    encryptToQRCodeAlphanumeric(data: number[] | string): string {
        if (typeof data === "string") {
            data = stringToUtf8ByteArray(data);
        }

        const cipher = this.encrypt(data);

        const base = u8toString32(cipher.base);

        const encrypted = cipher.body;

        const baseChar = String.fromCharCode(base);

        const result = base32.stringify(encrypted, { pad: false });

        const resultArray = stringToUtf8ByteArray(result);

        const len = resultArray.length;

        let sum = Long.fromNumber(base, true);

        resultArray.forEach((n) => {
            sum = sum.add(Long.fromNumber(n, true));
        });

        const baseIndex = this.keySumRev.xor(sum).mod(len + 1).toNumber();

        return result.substring(0, baseIndex) + baseChar + result.substring(baseIndex, len);
    }

    decryptQRCodeAlphanumeric(qrCodeAlphanumeric: string): number[] | false {
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

        try {
            const encrypted = base32.parse(encryptedBase32, { out: Array, loose: true }) as unknown as number[];

            return this.decrypt(base, encrypted);
        } catch {
            return false;
        }
    }
}

module.exports = ShortCrypt;
