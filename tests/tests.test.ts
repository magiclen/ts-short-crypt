import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ShortCrypt } from "../src/index.ts";

const binary = new Uint8Array([0, 1, 127, 128, 254, 255]);
const cases = ["", "a", "articles", "more than eight bytes"].map((s) =>
    new TextEncoder().encode(s),
);

cases.push(binary);

describe("Encryption", () => {
    it("should use `magickey` to encrypt `articles`", () => {
        const sc = new ShortCrypt("magickey");

        assert.deepEqual(sc.encrypt("articles"), {
            base: 8,
            body: new Uint8Array([216, 78, 214, 199, 157, 190, 78, 250]),
        });
        assert.equal(sc.encryptToURLComponent("articles"), "2E87Wx52-Tvo");
        assert.equal(sc.encryptToQRCodeAlphanumeric("articles"), "3BHNNR45XZH8PU");
    });
});

describe("Decryption", () => {
    it("should use `magickey` to decrypt ciphers to `articles`", () => {
        const sc = new ShortCrypt("magickey");
        const articles = new TextEncoder().encode("articles");

        assert.deepEqual(
            sc.decrypt({ base: 8, body: new Uint8Array([216, 78, 214, 199, 157, 190, 78, 250]) }),
            articles,
        );
        assert.deepEqual(sc.decryptURLComponent("2E87Wx52-Tvo"), articles);
        assert.deepEqual(sc.decryptQRCodeAlphanumeric("3BHNNR45XZH8PU"), articles);
    });

    it("should decrypt ciphers to strings", () => {
        const sc = new ShortCrypt("magickey");

        assert.equal(sc.decryptToString(sc.encrypt("articles")), "articles");
        assert.equal(sc.decryptURLComponentToString("2E87Wx52-Tvo"), "articles");
        assert.equal(sc.decryptQRCodeAlphanumericToString("3BHNNR45XZH8PU"), "articles");
    });

    it("should decrypt what it encrypts", () => {
        const sc = new ShortCrypt("magickey");

        for (const data of cases) {
            assert.deepEqual(sc.decrypt(sc.encrypt(data)), data);
            assert.deepEqual(sc.decryptURLComponent(sc.encryptToURLComponent(data)), data);
            assert.deepEqual(
                sc.decryptQRCodeAlphanumeric(sc.encryptToQRCodeAlphanumeric(data)),
                data,
            );
        }
    });

    it("should reject a tampered cipher", () => {
        const sc = new ShortCrypt("magickey");

        const cipher = sc.encrypt("articles");
        cipher.body[0] ^= 1;

        assert.equal(sc.decrypt(cipher), undefined);
    });
});
