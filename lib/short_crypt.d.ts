import Cipher from "./cipher";
export default class ShortCrypt {
    private hashedKey;
    private keySumRev;
    constructor(key: string);
    encrypt(data: number[] | string): Cipher;
    decrypt(base: number, body: number[]): number[] | false;
    decrypt(cipher: Cipher): number[] | false;
    encryptToURLComponent(data: number[] | string): string;
    descryptURLComponent(urlComponent: string): number[] | false;
    encryptToQRCodeAlphanumeric(data: number[] | string): string;
    decryptQRCodeAlphanumeric(qrCodeAlphanumeric: string): number[] | false;
}
