"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reverseU64 = exports.string32toU8 = exports.u8toString32 = exports.string64toU8 = exports.u8toString64 = exports.stringToUtf8ByteArray = void 0;
const long_1 = __importDefault(require("long"));
const stringToUtf8ByteArray = (str) => {
    const out = [];
    let p = 0;
    for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        if (c < 128) {
            out[p] = c;
            p += 1;
        }
        else if (c < 2048) {
            out[p] = (c >> 6) | 192;
            p += 1;
            out[p] = (c & 63) | 128;
            p += 1;
        }
        else if (((c & 0xFC00) === 0xD800) && (i + 1) < str.length && ((str.charCodeAt(i + 1) & 0xFC00) === 0xDC00)) {
            i += 1;
            c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(i) & 0x03FF);
            out[p] = (c >> 18) | 240;
            p += 1;
            out[p] = ((c >> 12) & 63) | 128;
            p += 1;
            out[p] = ((c >> 6) & 63) | 128;
            p += 1;
            out[p] = (c & 63) | 128;
            p += 1;
        }
        else {
            out[p] = (c >> 12) | 224;
            out[p] = ((c >> 6) & 63) | 128;
            out[p] = (c & 63) | 128;
        }
    }
    return out;
};
exports.stringToUtf8ByteArray = stringToUtf8ByteArray;
const u8toString64 = (i) => {
    if (i < 10) {
        return i + "0".charCodeAt(0);
    }
    else if (i >= 10 && i < 36) {
        return i - 10 + "A".charCodeAt(0);
    }
    else if (i >= 36 && i < 62) {
        return i - 36 + "a".charCodeAt(0);
    }
    else if (i === 62) {
        return "-".charCodeAt(0);
    }
    else {
        return "_".charCodeAt(0);
    }
};
exports.u8toString64 = u8toString64;
const string64toU8 = (c) => {
    if (c >= "0".charCodeAt(0) && c <= "9".charCodeAt(0)) {
        return c - "0".charCodeAt(0);
    }
    else if (c >= "A".charCodeAt(0) && c <= "Z".charCodeAt(0)) {
        return c + 10 - "A".charCodeAt(0);
    }
    else if (c >= "a".charCodeAt(0) && c <= "z".charCodeAt(0)) {
        return c + 36 - "a".charCodeAt(0);
    }
    else if (c === "-".charCodeAt(0)) {
        return 62;
    }
    else {
        return 63;
    }
};
exports.string64toU8 = string64toU8;
const u8toString32 = (i) => {
    if (i < 10) {
        return i + "0".charCodeAt(0);
    }
    else {
        return i - 10 + "A".charCodeAt(0);
    }
};
exports.u8toString32 = u8toString32;
const string32toU8 = (c) => {
    if (c >= "0".charCodeAt(0) && c <= "9".charCodeAt(0)) {
        return c - "0".charCodeAt(0);
    }
    else {
        return c + 10 - "A".charCodeAt(0);
    }
};
exports.string32toU8 = string32toU8;
const reverseU64 = (v) => {
    v = v.shiftRight(1).and(new long_1.default(0x55555555, 0x55555555)).or(v.and(new long_1.default(0x55555555, 0x55555555)).shiftLeft(1));
    v = v.shiftRight(2).and(new long_1.default(0x33333333, 0x33333333)).or(v.and(new long_1.default(0x33333333, 0x33333333)).shiftLeft(2));
    v = v.shiftRight(4).and(new long_1.default(0x0F0F0F0F, 0x0F0F0F0F)).or(v.and(new long_1.default(0x0F0F0F0F, 0x0F0F0F0F)).shiftLeft(4));
    v = v.shiftRight(8).and(new long_1.default(0x00FF00FF, 0x00FF00FF)).or(v.and(new long_1.default(0x00FF00FF, 0x00FF00FF)).shiftLeft(8));
    v = v.shiftRight(16).and(new long_1.default(0x0000FFFF, 0x0000FFFF)).or(v.and(new long_1.default(0x0000FFFF, 0x0000FFFF)).shiftLeft(16));
    v = v.shiftRight(32).or(v.shiftLeft(32));
    return v;
};
exports.reverseU64 = reverseU64;
