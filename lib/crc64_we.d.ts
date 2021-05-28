import Long from "long";
export default class Crc64We {
    private lookupTable;
    private sum;
    private finalXOR;
    digest(data: number[] | string): void;
    getNumber(): Long.Long;
    getLong(): Long.Long;
    getByteArray(): number[];
}
