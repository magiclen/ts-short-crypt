import Long from "long";

export const u8toString64 = (i: number): number => {
    if (i < 10) {
        return i + "0".charCodeAt(0);
    } else if (i >= 10 && i < 36) {
        return i - 10 + "A".charCodeAt(0);
    } else if (i >= 36 && i < 62) {
        return i - 36 + "a".charCodeAt(0);
    } else if (i === 62) {
        return "-".charCodeAt(0);
    } else {
        return "_".charCodeAt(0);
    }
};

export const string64toU8 = (c: number): number => {
    if (c >= "0".charCodeAt(0) && c <= "9".charCodeAt(0)) {
        return c - "0".charCodeAt(0);
    } else if (c >= "A".charCodeAt(0) && c <= "Z".charCodeAt(0)) {
        return c + 10 - "A".charCodeAt(0);
    } else if (c >= "a".charCodeAt(0) && c <= "z".charCodeAt(0)) {
        return c + 36 - "a".charCodeAt(0);
    } else if (c === "-".charCodeAt(0)) {
        return 62;
    } else {
        return 63;
    }
};

export const u8toString32 = (i: number): number => {
    if (i < 10) {
        return i + "0".charCodeAt(0);
    } else {
        return i - 10 + "A".charCodeAt(0);
    }
};

export const string32toU8 = (c: number): number => {
    if (c >= "0".charCodeAt(0) && c <= "9".charCodeAt(0)) {
        return c - "0".charCodeAt(0);
    } else {
        return c + 10 - "A".charCodeAt(0);
    }
};

export const reverseU64 = (v: Long): Long => {
    v = v.shiftRight(1).and(new Long(0x55555555, 0x55555555)).or(v.and(new Long(0x55555555, 0x55555555)).shiftLeft(1));
    v = v.shiftRight(2).and(new Long(0x33333333, 0x33333333)).or(v.and(new Long(0x33333333, 0x33333333)).shiftLeft(2));
    v = v.shiftRight(4).and(new Long(0x0F0F0F0F, 0x0F0F0F0F)).or(v.and(new Long(0x0F0F0F0F, 0x0F0F0F0F)).shiftLeft(4));
    v = v.shiftRight(8).and(new Long(0x00FF00FF, 0x00FF00FF)).or(v.and(new Long(0x00FF00FF, 0x00FF00FF)).shiftLeft(8));
    v = v.shiftRight(16).and(new Long(0x0000FFFF, 0x0000FFFF)).or(v.and(new Long(0x0000FFFF, 0x0000FFFF)).shiftLeft(16));
    v = v.shiftRight(32).or(v.shiftLeft(32));

    return v;
};
