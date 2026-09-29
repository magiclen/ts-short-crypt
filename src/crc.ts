const CRC8_CDMA2000_POLY = 0x9b;

const CRC64_WE_POLY = 0x42f0e1eba9ea3693n;
const U64_MASK = 0xffff_ffff_ffff_ffffn;

const crc8Table = new Uint8Array(256);

for (let i = 0; i < 256; i++) {
    let crc = i;

    for (let j = 0; j < 8; j++) {
        crc = ((crc << 1) ^ ((crc & 0x80) === 0 ? 0 : CRC8_CDMA2000_POLY)) & 0xff;
    }

    crc8Table[i] = crc;
}

const crc64Table = new BigUint64Array(256);

for (let i = 0; i < 256; i++) {
    let crc = BigInt(i) << 56n;

    for (let j = 0; j < 8; j++) {
        crc = ((crc << 1n) ^ (crc >> 63n === 0n ? 0n : CRC64_WE_POLY)) & U64_MASK;
    }

    crc64Table[i] = crc;
}

/** Calculates the CRC-8/CDMA2000 checksum of the data. */
export const crc8Cdma2000 = (data: Uint8Array): number => {
    let crc = 0xff;

    for (const n of data) {
        crc = crc8Table[crc ^ n];
    }

    return crc;
};

/** Calculates the CRC-64/WE checksum of the data. */
export const crc64We = (data: Uint8Array): bigint => {
    let crc = U64_MASK;

    for (const n of data) {
        crc = ((crc << 8n) & U64_MASK) ^ crc64Table[Number(crc >> 56n) ^ n];
    }

    return crc ^ U64_MASK;
};
