const BASE64_URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const createDecodeTable = (alphabet: string): Int8Array => {
    const table = new Int8Array(128).fill(-1);

    for (let i = 0; i < alphabet.length; i++) {
        table[alphabet.charCodeAt(i)] = i;
    }

    return table;
};

const BASE64_URL_DECODE_TABLE = createDecodeTable(BASE64_URL_ALPHABET);
const BASE32_DECODE_TABLE = createDecodeTable(BASE32_ALPHABET);

const encode = (data: Uint8Array, alphabet: string, bitsPerChar: number): string => {
    const mask = (1 << bitsPerChar) - 1;

    let result = "";
    let buffer = 0;
    let bits = 0;

    for (const n of data) {
        buffer = (buffer << 8) | n;
        bits += 8;

        while (bits >= bitsPerChar) {
            bits -= bitsPerChar;
            result += alphabet[(buffer >> bits) & mask];
        }

        buffer &= (1 << bits) - 1;
    }

    if (bits > 0) {
        result += alphabet[(buffer << (bitsPerChar - bits)) & mask];
    }

    return result;
};

const decode = (
    text: string,
    decodeTable: Int8Array,
    bitsPerChar: number,
    strict: boolean,
): Uint8Array | undefined => {
    const output = new Uint8Array(Math.floor((text.length * bitsPerChar) / 8));

    let buffer = 0;
    let bits = 0;
    let written = 0;

    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        const value = code < 128 ? decodeTable[code] : -1;

        if (value < 0) {
            return undefined;
        }

        buffer = (buffer << bitsPerChar) | value;
        bits += bitsPerChar;

        if (bits >= 8) {
            bits -= 8;
            output[written++] = buffer >> bits;
        }

        buffer &= (1 << bits) - 1;
    }

    // the strict mode rejects a useless last character and non-zero padding bits
    if (strict && (bits >= bitsPerChar || buffer !== 0)) {
        return undefined;
    }

    return output;
};

/** Encodes data to unpadded Base64-URL text. */
export const encodeBase64Url = (data: Uint8Array): string => encode(data, BASE64_URL_ALPHABET, 6);

/**
 * Decodes unpadded Base64-URL text. Like the Rust `base64` crate, it rejects padding, an invalid
 * length, and non-zero padding bits.
 */
export const decodeBase64Url = (text: string): Uint8Array | undefined =>
    decode(text, BASE64_URL_DECODE_TABLE, 6, true);

/** Encodes data to unpadded RFC 4648 Base32 text. */
export const encodeBase32 = (data: Uint8Array): string => encode(data, BASE32_ALPHABET, 5);

/**
 * Decodes unpadded RFC 4648 Base32 text in uppercase. Like the Rust `base32` crate, it ignores the
 * extra bits at the end.
 */
export const decodeBase32 = (text: string): Uint8Array | undefined =>
    decode(text, BASE32_DECODE_TABLE, 5, false);
