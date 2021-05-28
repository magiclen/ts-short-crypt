ShortCrypt
====================

ShortCrypt is a very simple encryption library, which aims to encrypt any data into something random at first glance. Even if these data are similar, the ciphers are still pretty different. The most important thing is that a cipher is only **4 bits** larger than its plaintext so that it is suitable for data used in an URL or a QR Code. Besides these, it is also an ideal candidate for serial number generation.

## Usage for Browsers

First of all, import `short-crypt.min.js` into your HTML `head`.

```html
<script src="https://cdn.jsdelivr.net/npm/short-crypt/dist/short-crypt.min.js"></script>
```

Then, create a `ShortCrypt` instance with a key (string).

```javascript
const sc = new ShortCrypt(key);
```

For encryption, you can choose to use one of these following methods:

* `encrypt`: encrypts data to an object, a cipher separated into **base** and **body**
* `encryptToURLComponent`: encrypts data to a string suitably concatenated with URLs
* `encryptToQRCodeAlphanumeric`: encrypts data to a string with the compatibility with QR code alphanumeric mode

Only a string or a byte array can be encrypted.

```javascript
const cipher1 = sc.encryptToURLComponent(plainText);
const cipher2 = sc.encryptToQRCodeAlphanumeric(plainText);
```

For decryption, you can use `decrypt`, `decryptURLComponent`, or `decryptQRCodeAlphanumeric` method.

```javascript
const result1 = sc.decryptURLComponent(cipher1);
const result2 = sc.decryptQRCodeAlphanumeric(cipher2);
```

## License

[MIT](LICENSE)