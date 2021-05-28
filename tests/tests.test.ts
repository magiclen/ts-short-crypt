import { describe, it } from "mocha";
import { expect } from "chai";

import ShortCrypt from "../src/short_crypt";

describe("Encryption", function () {
    it("should use `magickey` to encrypt `articles`", () => {
        let sc = new ShortCrypt("magickey");

        expect(sc.encryptToURLComponent("articles")).to.equal("2E87Wx52-Tvo");
        expect(sc.encryptToQRCodeAlphanumeric("articles")).to.equal("3BHNNR45XZH8PU");
    });
});

describe("Decryption", function () {
    it("should use `magickey` to decrypt ciphers to `articles`", () => {
        let sc = new ShortCrypt("magickey");

        expect(sc.encryptToURLComponent("articles")).to.equal("2E87Wx52-Tvo");
        expect(sc.encryptToQRCodeAlphanumeric("articles")).to.equal("3BHNNR45XZH8PU");
    });
});
