import { crc64We, crc8Cdma2000 } from "./crc.ts";
import { decodeBase32, decodeBase64Url, encodeBase32, encodeBase64Url } from "./encoding.ts";

/**
 * A cipher made of a 5-bit **base** and a **body** whose length equals the plaintext length. You
 * can combine them with your own algorithm, or use `encryptToURLComponent` or
 * `encryptToQRCodeAlphanumeric` to produce a random-like string.
 */
export interface Cipher {
    /** An integer from 0 to 31. */
    base: number;

    /** The encrypted data. */
    body: Uint8Array;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

const toBytes = (data: Uint8Array | string): Uint8Array =>
    typeof data === "string" ? textEncoder.encode(data) : data;

const decodeUtf8 = (data: Uint8Array | undefined): string | undefined => {
    if (data === undefined) {
        return undefined;
    }

    try {
        return textDecoder.decode(data);
    } catch {
        return undefined;
    }
};

const toBigEndianBytes = (value: bigint): Uint8Array => {
    const bytes = new Uint8Array(8);

    new DataView(bytes.buffer).setBigUint64(0, value);

    return bytes;
};

const reverseBits = (value: bigint): bigint => {
    let result = 0n;

    for (let i = 0; i < 64; i++) {
        result = (result << 1n) | (value & 1n);
        value >>= 1n;
    }

    return result;
};

// The base is from 0 to 31, so it is written as one of `0-9` and `A-V`.
const encodeBase = (base: number): number => (base < 10 ? base + 0x30 : base - 10 + 0x41);

const decodeBase = (code: number): number | undefined => {
    if (code >= 0x30 && code <= 0x39) {
        return code - 0x30;
    }

    if (code >= 0x41 && code <= 0x56) {
        return code - 0x41 + 10;
    }

    return undefined;
};

const checksumBase = (data: Uint8Array): number => crc8Cdma2000(data) % 32;

// The sum never exceeds `Number.MAX_SAFE_INTEGER` for any possible data length, so it equals the wrapping `u64` sum in Rust.
const sumBytes = (bytes: Uint8Array): number => {
    let sum = 0;

    for (const n of bytes) {
        sum += n;
    }

    return sum;
};

const permutationSeed = (m: number, sum: number): Uint8Array => {
    const bytes = new Uint8Array(9);

    bytes[0] = m;
    new DataView(bytes.buffer).setBigUint64(1, BigInt(sum));

    return toBigEndianBytes(crc64We(bytes));
};

/** A deterministic encryption context derived from a string key. */
export class ShortCrypt {
    readonly #hashedKey: Uint8Array;

    readonly #keySumRev: bigint;

    /** Creates a new `ShortCrypt` instance from a string key. */
    constructor(key: string) {
        const keyBytes = textEncoder.encode(key);

        this.#hashedKey = toBigEndianBytes(crc64We(keyBytes));
        this.#keySumRev = reverseBits(BigInt(sumBytes(keyBytes)));
    }

    /** Encrypts a string (as UTF-8) or bytes into a `Cipher`. */
    encrypt(plaintext: Uint8Array | string): Cipher {
        const data = toBytes(plaintext);
        const len = data.length;

        const base = checksumBase(data);

        const body = new Uint8Array(len);

        let m = base;
        let sum = base;

        for (let i = 0; i < len; i++) {
            const v = data[i] ^ this.#hashedKey[i % 8] ^ base;

            body[i] = v;

            m ^= v;
            sum += v;
        }

        const seed = permutationSeed(m, sum);

        for (let i = 0; i < len; i++) {
            this.#swap(body, seed, i);
        }

        return { base, body };
    }

    /**
     * Decrypts a `Cipher`.
     *
     * @returns The plaintext bytes, or `undefined` if the cipher is incorrect.
     */
    decrypt(cipher: Cipher): Uint8Array | undefined {
        const { base, body } = cipher;

        if (!Number.isInteger(base) || base < 0 || base > 31) {
            return undefined;
        }

        // Copy the body so that the data of the caller is not changed (`slice` does not copy a `Buffer`).
        return this.#decryptInPlace(base, new Uint8Array(body));
    }

    /**
     * Decrypts a `Cipher` into a UTF-8 string.
     *
     * @returns The plaintext string, or `undefined` if the cipher is incorrect or the plaintext is
     *   not valid UTF-8.
     */
    decryptToString(cipher: Cipher): string | undefined {
        return decodeUtf8(this.decrypt(cipher));
    }

    /**
     * Encrypts a string (as UTF-8) or bytes into a random-like string based on Base64-URL. The
     * result can be concatenated with URLs.
     */
    encryptToURLComponent(plaintext: Uint8Array | string): string {
        const { base, body } = this.encrypt(plaintext);

        return this.#insertBase(base, encodeBase64Url(body));
    }

    /**
     * Decrypts a string created by `encryptToURLComponent`.
     *
     * @returns The plaintext bytes, or `undefined` if the string is incorrect.
     */
    decryptURLComponent(urlComponent: string): Uint8Array | undefined {
        const extracted = this.#extractBase(urlComponent);

        if (extracted === undefined) {
            return undefined;
        }

        const body = decodeBase64Url(extracted.rest);

        if (body === undefined) {
            return undefined;
        }

        return this.#decryptInPlace(extracted.base, body);
    }

    /**
     * Decrypts a string created by `encryptToURLComponent` into a UTF-8 string.
     *
     * @returns The plaintext string, or `undefined` if the string is incorrect or the plaintext is
     *   not valid UTF-8.
     */
    decryptURLComponentToString(urlComponent: string): string | undefined {
        return decodeUtf8(this.decryptURLComponent(urlComponent));
    }

    /**
     * Encrypts a string (as UTF-8) or bytes into a random-like string based on Base32. The result
     * is compatible with the alphanumeric mode of QR codes.
     */
    encryptToQRCodeAlphanumeric(plaintext: Uint8Array | string): string {
        const { base, body } = this.encrypt(plaintext);

        return this.#insertBase(base, encodeBase32(body));
    }

    /**
     * Decrypts a string created by `encryptToQRCodeAlphanumeric`.
     *
     * @returns The plaintext bytes, or `undefined` if the string is incorrect.
     */
    decryptQRCodeAlphanumeric(qrCodeAlphanumeric: string): Uint8Array | undefined {
        const extracted = this.#extractBase(qrCodeAlphanumeric);

        if (extracted === undefined) {
            return undefined;
        }

        const body = decodeBase32(extracted.rest);

        if (body === undefined) {
            return undefined;
        }

        return this.#decryptInPlace(extracted.base, body);
    }

    /**
     * Decrypts a string created by `encryptToQRCodeAlphanumeric` into a UTF-8 string.
     *
     * @returns The plaintext string, or `undefined` if the string is incorrect or the plaintext is
     *   not valid UTF-8.
     */
    decryptQRCodeAlphanumericToString(qrCodeAlphanumeric: string): string | undefined {
        return decodeUtf8(this.decryptQRCodeAlphanumeric(qrCodeAlphanumeric));
    }

    #swap(data: Uint8Array, seed: Uint8Array, i: number): void {
        const index = i % 8;
        const p = (seed[index] ^ this.#hashedKey[index]) % data.length;

        if (p !== i) {
            const t = data[i];

            data[i] = data[p];
            data[p] = t;
        }
    }

    #decryptInPlace(base: number, data: Uint8Array): Uint8Array | undefined {
        const len = data.length;

        let m = base;
        let sum = base;

        for (const v of data) {
            m ^= v;
            sum += v;
        }

        const seed = permutationSeed(m, sum);

        for (let i = len - 1; i >= 0; i--) {
            this.#swap(data, seed, i);
        }

        for (let i = 0; i < len; i++) {
            data[i] ^= this.#hashedKey[i % 8] ^ base;
        }

        if (checksumBase(data) !== base) {
            return undefined;
        }

        return data;
    }

    #baseIndex(sum: number, length: number): number {
        return Number((this.#keySumRev ^ BigInt(sum)) % BigInt(length));
    }

    #insertBase(base: number, encoded: string): string {
        const baseCode = encodeBase(base);

        let sum = baseCode;

        for (let i = 0; i < encoded.length; i++) {
            sum += encoded.charCodeAt(i);
        }

        const index = this.#baseIndex(sum, encoded.length + 1);

        return encoded.slice(0, index) + String.fromCharCode(baseCode) + encoded.slice(index);
    }

    #extractBase(text: string): { base: number; rest: string } | undefined {
        const len = text.length;

        if (len === 0) {
            return undefined;
        }

        let sum = 0;

        for (let i = 0; i < len; i++) {
            const code = text.charCodeAt(i);

            // Rust always rejects non-ASCII text, and only for ASCII text are UTF-16 indexes equal to UTF-8 byte indexes.
            if (code > 0x7f) {
                return undefined;
            }

            sum += code;
        }

        const index = this.#baseIndex(sum, len);
        const base = decodeBase(text.charCodeAt(index));

        if (base === undefined) {
            return undefined;
        }

        return { base, rest: text.slice(0, index) + text.slice(index + 1) };
    }
}
