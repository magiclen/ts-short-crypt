import Cipher from "./cipher";
export default class ShortCrypt {
    private hashedKey;
    private keySumRev;
    constructor(key: string);
    encrypt(data: number[] | string): Cipher;
    decrypt(base: number, body: number[]): number[] | boolean;
    decrypt(cipher: Cipher): number[] | boolean;
    encryptToURLComponent(data: number[] | string): string;
    descryptURLComponent(urlComponent: string): boolean | number[];
    encryptToQRCodeAlphanumeric(data: number[] | string): string;
    decryptQRCodeAlphanumeric(qrCodeAlphanumeric: string): boolean | number[];
}
