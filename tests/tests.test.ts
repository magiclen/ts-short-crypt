import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ShortCrypt } from "../src/index.ts";

const toString = (data: Uint8Array | false): string =>
    data === false ? "" : Buffer.from(data).toString("utf8");

describe("Encryption", () => {
    it("should use `magickey` to encrypt `articles`", () => {
        const sc = new ShortCrypt("magickey");

        assert.equal(sc.encryptToURLComponent("articles"), "2E87Wx52-Tvo");
        assert.equal(sc.encryptToQRCodeAlphanumeric("articles"), "3BHNNR45XZH8PU");
    });
});

describe("Decryption", () => {
    it("should use `magickey` to decrypt ciphers to `articles`", () => {
        const sc = new ShortCrypt("magickey");

        assert.equal(toString(sc.decryptURLComponent("2E87Wx52-Tvo")), "articles");
        assert.equal(toString(sc.decryptQRCodeAlphanumeric("3BHNNR45XZH8PU")), "articles");
    });
});
