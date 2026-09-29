ShortCrypt
====================

[![CI](https://github.com/magiclen/ts-short-crypt/actions/workflows/ci.yml/badge.svg)](https://github.com/magiclen/ts-short-crypt/actions/workflows/ci.yml)

ShortCrypt is a very simple deterministic encryption library, which aims to encrypt any data into something random at first glance. Even if these data are similar, the ciphers are still pretty different. The most important thing is that a cipher contains only **5 bits** more information than its plaintext so that it is suitable for data used in a URL or a QR Code. Besides these, it is also an ideal candidate for serial number generation.

ShortCrypt does not provide cryptographic authentication and must not be used to protect sensitive data or resist malicious tampering.

The algorithm is the same as the [Rust version](https://github.com/magiclen/rust-short-crypt), so the ciphers can be decrypted by each other.

Node.js 24 or later is required.

## Usage

Create a `ShortCrypt` instance with a key (string).

```typescript
import { ShortCrypt } from "short-crypt";

const sc = new ShortCrypt("magickey");
```

A plaintext can be a string (encoded as UTF-8) or a `Uint8Array`.

### URL Component

`encryptToURLComponent` encrypts data into a random-like string based on Base64-URL, so that it can be concatenated with URLs.

```typescript
const cipher = sc.encryptToURLComponent("articles"); // "2E87Wx52-Tvo"

const bytes = sc.decryptURLComponent(cipher); // Uint8Array
const text = sc.decryptURLComponentToString(cipher); // "articles"
```

### QR Code Alphanumeric

`encryptToQRCodeAlphanumeric` encrypts data into a random-like string based on Base32, so that it can be inserted into a QR code with the alphanumeric mode.

```typescript
const cipher = sc.encryptToQRCodeAlphanumeric("articles"); // "3BHNNR45XZH8PU"

const bytes = sc.decryptQRCodeAlphanumeric(cipher); // Uint8Array
const text = sc.decryptQRCodeAlphanumericToString(cipher); // "articles"
```

### Cipher

`encrypt` creates a `Cipher` object with a **base** and a **body**. The **base** is an integer from 0 to 31, and the size of the **body** is equal to the plaintext. You can use your own algorithm to combine them.

```typescript
import type { Cipher } from "short-crypt";

const cipher: Cipher = sc.encrypt("articles"); // { base: 8, body: Uint8Array [216, 78, 214, 199, 157, 190, 78, 250] }

const bytes = sc.decrypt(cipher); // Uint8Array
const text = sc.decryptToString(cipher); // "articles"
```

### Failure

The decryption methods return `undefined` if the cipher is incorrect, such as a cipher encrypted with another key, or a tampered cipher (detected by a 5-bit checksum). The `...ToString` methods also return `undefined` if the plaintext is not valid UTF-8.

```typescript
const text = sc.decryptURLComponentToString(input);

if (text === undefined) {
    // incorrect cipher
}
```

## Migrating from 4.x

- Node.js 24 or later is required, and the package no longer has any dependencies.
- The decryption methods return `undefined` instead of `false` on failure.
- The decryption methods check the checksum, so an incorrect cipher is rejected instead of being decrypted into garbage.
- `decrypt(base, body)` is removed. Use `decrypt({ base, body })` instead.
- `decrypt` no longer changes the `body` of the given cipher.
- The `Cipher` type is exported.
- In browsers, the global variable `ShortCrypt` becomes a namespace. Use `new ShortCrypt.ShortCrypt(key)` instead of `new ShortCrypt(key)`.

## Usage for Browsers

```html
<script src="https://cdn.jsdelivr.net/gh/magiclen/ts-short-crypt/dist/short-crypt.min.js"></script>
<script>
    const sc = new ShortCrypt.ShortCrypt("magickey");
</script>
```

[Source](demo.html)

[Demo Page](https://rawcdn.githack.com/magiclen/ts-short-crypt/master/demo.html)

## License

[MIT](LICENSE)
