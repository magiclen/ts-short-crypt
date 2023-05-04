import { ShortCrypt } from "../src/lib.js";

describe("Encryption", function () {
    it("should use `magickey` to encrypt `articles`", () => {
        const sc = new ShortCrypt("magickey");

        expect(sc.encryptToURLComponent("articles")).toBe("2E87Wx52-Tvo");
        expect(sc.encryptToQRCodeAlphanumeric("articles")).toBe("3BHNNR45XZH8PU");
    });
});

describe("Decryption", function () {
    it("should use `magickey` to decrypt ciphers to `articles`", () => {
        const sc = new ShortCrypt("magickey");
        
        expect(Buffer.from(sc.decryptURLComponent("2E87Wx52-Tvo") || []).toString("utf8")).toBe("articles");
        expect(Buffer.from(sc.decryptQRCodeAlphanumeric("3BHNNR45XZH8PU") || []).toString("utf8")).toBe("articles");
    });
});
