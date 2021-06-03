import Long from "long";

import { stringToUtf8ByteArray } from "./functions";

export default class Crc64We  {
    private lookupTable = [
        new Long(0x0, 0x0), new Long(0xA9EA3693, 0x42F0E1EB), new Long(0x53D46D26, 0x85E1C3D7), new Long(0xFA3E5BB5, 0xC711223C), new Long(0xE42ECDF, 0x49336645), new Long(0xA7A8DA4C, 0xBC387AE), new Long(0x5D9681F9, 0xCCD2A592), new Long(0xF47CB76A, 0x8E224479), new Long(0x1C85D9BE, 0x9266CC8A), new Long(0xB56FEF2D, 0xD0962D61), new Long(0x4F51B498, 0x17870F5D), new Long(0xE6BB820B, 0x5577EEB6), new Long(0x12C73561, 0xDB55AACF), new Long(0xBB2D03F2, 0x99A54B24), new Long(0x41135847, 0x5EB46918), new Long(0xE8F96ED4, 0x1C4488F3), new Long(0x90E185EF, 0x663D78FF), new Long(0x390BB37C, 0x24CD9914), new Long(0xC335E8C9, 0xE3DCBB28), new Long(0x6ADFDE5A, 0xA12C5AC3), new Long(0x9EA36930, 0x2F0E1EBA), new Long(0x37495FA3, 0x6DFEFF51), new Long(0xCD770416, 0xAAEFDD6D), new Long(0x649D3285, 0xE81F3C86), new Long(0x8C645C51, 0xF45BB475), new Long(0x258E6AC2, 0xB6AB559E), new Long(0xDFB03177, 0x71BA77A2), new Long(0x765A07E4, 0x334A9649), new Long(0x8226B08E, 0xBD68D230), new Long(0x2BCC861D, 0xFF9833DB), new Long(0xD1F2DDA8, 0x388911E7), new Long(0x7818EB3B, 0x7A79F00C), new Long(0x21C30BDE, 0xCC7AF1FF), new Long(0x88293D4D, 0x8E8A1014), new Long(0x721766F8, 0x499B3228), new Long(0xDBFD506B, 0xB6BD3C3), new Long(0x2F81E701, 0x854997BA), new Long(0x866BD192, 0xC7B97651), new Long(0x7C558A27, 0xA8546D), new Long(0xD5BFBCB4, 0x4258B586), new Long(0x3D46D260, 0x5E1C3D75), new Long(0x94ACE4F3, 0x1CECDC9E), new Long(0x6E92BF46, 0xDBFDFEA2), new Long(0xC77889D5, 0x990D1F49), new Long(0x33043EBF, 0x172F5B30), new Long(0x9AEE082C, 0x55DFBADB), new Long(0x60D05399, 0x92CE98E7), new Long(0xC93A650A, 0xD03E790C), new Long(0xB1228E31, 0xAA478900), new Long(0x18C8B8A2, 0xE8B768EB), new Long(0xE2F6E317, 0x2FA64AD7), new Long(0x4B1CD584, 0x6D56AB3C), new Long(0xBF6062EE, 0xE374EF45), new Long(0x168A547D, 0xA1840EAE), new Long(0xECB40FC8, 0x66952C92), new Long(0x455E395B, 0x2465CD79), new Long(0xADA7578F, 0x3821458A), new Long(0x44D611C, 0x7AD1A461), new Long(0xFE733AA9, 0xBDC0865D), new Long(0x57990C3A, 0xFF3067B6), new Long(0xA3E5BB50, 0x711223CF), new Long(0xA0F8DC3, 0x33E2C224), new Long(0xF031D676, 0xF4F3E018), new Long(0x59DBE0E5, 0xB60301F3), new Long(0xEA6C212F, 0xDA050215), new Long(0x438617BC, 0x98F5E3FE), new Long(0xB9B84C09, 0x5FE4C1C2), new Long(0x10527A9A, 0x1D142029), new Long(0xE42ECDF0, 0x93366450), new Long(0x4DC4FB63, 0xD1C685BB), new Long(0xB7FAA0D6, 0x16D7A787), new Long(0x1E109645, 0x5427466C), new Long(0xF6E9F891, 0x4863CE9F), new Long(0x5F03CE02, 0xA932F74), new Long(0xA53D95B7, 0xCD820D48), new Long(0xCD7A324, 0x8F72ECA3), new Long(0xF8AB144E, 0x150A8DA), new Long(0x514122DD, 0x43A04931), new Long(0xAB7F7968, 0x84B16B0D), new Long(0x2954FFB, 0xC6418AE6), new Long(0x7A8DA4C0, 0xBC387AEA), new Long(0xD3679253, 0xFEC89B01), new Long(0x2959C9E6, 0x39D9B93D), new Long(0x80B3FF75, 0x7B2958D6), new Long(0x74CF481F, 0xF50B1CAF), new Long(0xDD257E8C, 0xB7FBFD44), new Long(0x271B2539, 0x70EADF78), new Long(0x8EF113AA, 0x321A3E93), new Long(0x66087D7E, 0x2E5EB660), new Long(0xCFE24BED, 0x6CAE578B), new Long(0x35DC1058, 0xABBF75B7), new Long(0x9C3626CB, 0xE94F945C), new Long(0x684A91A1, 0x676DD025), new Long(0xC1A0A732, 0x259D31CE), new Long(0x3B9EFC87, 0xE28C13F2), new Long(0x9274CA14, 0xA07CF219), new Long(0xCBAF2AF1, 0x167FF3EA), new Long(0x62451C62, 0x548F1201), new Long(0x987B47D7, 0x939E303D), new Long(0x31917144, 0xD16ED1D6), new Long(0xC5EDC62E, 0x5F4C95AF), new Long(0x6C07F0BD, 0x1DBC7444), new Long(0x9639AB08, 0xDAAD5678), new Long(0x3FD39D9B, 0x985DB793), new Long(0xD72AF34F, 0x84193F60), new Long(0x7EC0C5DC, 0xC6E9DE8B), new Long(0x84FE9E69, 0x1F8FCB7), new Long(0x2D14A8FA, 0x43081D5C), new Long(0xD9681F90, 0xCD2A5925), new Long(0x70822903, 0x8FDAB8CE), new Long(0x8ABC72B6, 0x48CB9AF2), new Long(0x23564425, 0xA3B7B19), new Long(0x5B4EAF1E, 0x70428B15), new Long(0xF2A4998D, 0x32B26AFE), new Long(0x89AC238, 0xF5A348C2), new Long(0xA170F4AB, 0xB753A929), new Long(0x550C43C1, 0x3971ED50), new Long(0xFCE67552, 0x7B810CBB), new Long(0x6D82EE7, 0xBC902E87), new Long(0xAF321874, 0xFE60CF6C), new Long(0x47CB76A0, 0xE224479F), new Long(0xEE214033, 0xA0D4A674), new Long(0x141F1B86, 0x67C58448), new Long(0xBDF52D15, 0x253565A3), new Long(0x49899A7F, 0xAB1721DA), new Long(0xE063ACEC, 0xE9E7C031), new Long(0x1A5DF759, 0x2EF6E20D), new Long(0xB3B7C1CA, 0x6C0603E6), new Long(0x7D3274CD, 0xF6FAE5C0), new Long(0xD4D8425E, 0xB40A042B), new Long(0x2EE619EB, 0x731B2617), new Long(0x870C2F78, 0x31EBC7FC), new Long(0x73709812, 0xBFC98385), new Long(0xDA9AAE81, 0xFD39626E), new Long(0x20A4F534, 0x3A284052), new Long(0x894EC3A7, 0x78D8A1B9), new Long(0x61B7AD73, 0x649C294A), new Long(0xC85D9BE0, 0x266CC8A1), new Long(0x3263C055, 0xE17DEA9D), new Long(0x9B89F6C6, 0xA38D0B76), new Long(0x6FF541AC, 0x2DAF4F0F), new Long(0xC61F773F, 0x6F5FAEE4), new Long(0x3C212C8A, 0xA84E8CD8), new Long(0x95CB1A19, 0xEABE6D33), new Long(0xEDD3F122, 0x90C79D3F), new Long(0x4439C7B1, 0xD2377CD4), new Long(0xBE079C04, 0x15265EE8), new Long(0x17EDAA97, 0x57D6BF03), new Long(0xE3911DFD, 0xD9F4FB7A), new Long(0x4A7B2B6E, 0x9B041A91), new Long(0xB04570DB, 0x5C1538AD), new Long(0x19AF4648, 0x1EE5D946), new Long(0xF156289C, 0x2A151B5), new Long(0x58BC1E0F, 0x4051B05E), new Long(0xA28245BA, 0x87409262), new Long(0xB687329, 0xC5B07389), new Long(0xFF14C443, 0x4B9237F0), new Long(0x56FEF2D0, 0x962D61B), new Long(0xACC0A965, 0xCE73F427), new Long(0x52A9FF6, 0x8C8315CC), new Long(0x5CF17F13, 0x3A80143F), new Long(0xF51B4980, 0x7870F5D4), new Long(0xF251235, 0xBF61D7E8), new Long(0xA6CF24A6, 0xFD913603), new Long(0x52B393CC, 0x73B3727A), new Long(0xFB59A55F, 0x31439391), new Long(0x167FEEA, 0xF652B1AD), new Long(0xA88DC879, 0xB4A25046), new Long(0x4074A6AD, 0xA8E6D8B5), new Long(0xE99E903E, 0xEA16395E), new Long(0x13A0CB8B, 0x2D071B62), new Long(0xBA4AFD18, 0x6FF7FA89), new Long(0x4E364A72, 0xE1D5BEF0), new Long(0xE7DC7CE1, 0xA3255F1B), new Long(0x1DE22754, 0x64347D27), new Long(0xB40811C7, 0x26C49CCC), new Long(0xCC10FAFC, 0x5CBD6CC0), new Long(0x65FACC6F, 0x1E4D8D2B), new Long(0x9FC497DA, 0xD95CAF17), new Long(0x362EA149, 0x9BAC4EFC), new Long(0xC2521623, 0x158E0A85), new Long(0x6BB820B0, 0x577EEB6E), new Long(0x91867B05, 0x906FC952), new Long(0x386C4D96, 0xD29F28B9), new Long(0xD0952342, 0xCEDBA04A), new Long(0x797F15D1, 0x8C2B41A1), new Long(0x83414E64, 0x4B3A639D), new Long(0x2AAB78F7, 0x9CA8276), new Long(0xDED7CF9D, 0x87E8C60F), new Long(0x773DF90E, 0xC51827E4), new Long(0x8D03A2BB, 0x20905D8), new Long(0x24E99428, 0x40F9E433), new Long(0x975E55E2, 0x2CFFE7D5), new Long(0x3EB46371, 0x6E0F063E), new Long(0xC48A38C4, 0xA91E2402), new Long(0x6D600E57, 0xEBEEC5E9), new Long(0x991CB93D, 0x65CC8190), new Long(0x30F68FAE, 0x273C607B), new Long(0xCAC8D41B, 0xE02D4247), new Long(0x6322E288, 0xA2DDA3AC), new Long(0x8BDB8C5C, 0xBE992B5F), new Long(0x2231BACF, 0xFC69CAB4), new Long(0xD80FE17A, 0x3B78E888), new Long(0x71E5D7E9, 0x79880963), new Long(0x85996083, 0xF7AA4D1A), new Long(0x2C735610, 0xB55AACF1), new Long(0xD64D0DA5, 0x724B8ECD), new Long(0x7FA73B36, 0x30BB6F26), new Long(0x7BFD00D, 0x4AC29F2A), new Long(0xAE55E69E, 0x8327EC1), new Long(0x546BBD2B, 0xCF235CFD), new Long(0xFD818BB8, 0x8DD3BD16), new Long(0x9FD3CD2, 0x3F1F96F), new Long(0xA0170A41, 0x41011884), new Long(0x5A2951F4, 0x86103AB8), new Long(0xF3C36767, 0xC4E0DB53), new Long(0x1B3A09B3, 0xD8A453A0), new Long(0xB2D03F20, 0x9A54B24B), new Long(0x48EE6495, 0x5D459077), new Long(0xE1045206, 0x1FB5719C), new Long(0x1578E56C, 0x919735E5), new Long(0xBC92D3FF, 0xD367D40E), new Long(0x46AC884A, 0x1476F632), new Long(0xEF46BED9, 0x568617D9), new Long(0xB69D5E3C, 0xE085162A), new Long(0x1F7768AF, 0xA275F7C1), new Long(0xE549331A, 0x6564D5FD), new Long(0x4CA30589, 0x27943416), new Long(0xB8DFB2E3, 0xA9B6706F), new Long(0x11358470, 0xEB469184), new Long(0xEB0BDFC5, 0x2C57B3B8), new Long(0x42E1E956, 0x6EA75253), new Long(0xAA188782, 0x72E3DAA0), new Long(0x3F2B111, 0x30133B4B), new Long(0xF9CCEAA4, 0xF7021977), new Long(0x5026DC37, 0xB5F2F89C), new Long(0xA45A6B5D, 0x3BD0BCE5), new Long(0xDB05DCE, 0x79205D0E), new Long(0xF78E067B, 0xBE317F32), new Long(0x5E6430E8, 0xFCC19ED9), new Long(0x267CDBD3, 0x86B86ED5), new Long(0x8F96ED40, 0xC4488F3E), new Long(0x75A8B6F5, 0x359AD02), new Long(0xDC428066, 0x41A94CE9), new Long(0x283E370C, 0xCF8B0890), new Long(0x81D4019F, 0x8D7BE97B), new Long(0x7BEA5A2A, 0x4A6ACB47), new Long(0xD2006CB9, 0x89A2AAC), new Long(0x3AF9026D, 0x14DEA25F), new Long(0x931334FE, 0x562E43B4), new Long(0x692D6F4B, 0x913F6188), new Long(0xC0C759D8, 0xD3CF8063), new Long(0x34BBEEB2, 0x5DEDC41A), new Long(0x9D51D821, 0x1F1D25F1), new Long(0x676F8394, 0xD80C07CD), new Long(0xCE85B507, 0x9AFCE626),
    ];

    private sum = new Long(0xFFFFFFFF, 0xFFFFFFFF);

    private finalXOR = new Long(0xFFFFFFFF, 0xFFFFFFFF);

    digest(data: number[] | string): void {
        if (typeof data === "string") {
            data = stringToUtf8ByteArray(data);
        }

        data.forEach((n) => {
            const index = this.sum.shiftRightUnsigned(56).xor(n).toNumber();
            this.sum = this.sum.shiftLeft(8).xor(this.lookupTable[index]);
        });
    }

    getNumber(): Long {
        return this.sum;
    }

    getLong(): Long {
        return this.sum.xor(this.finalXOR);
    }

    getByteArray(): number[] {
        return this.getLong().toBytesBE();
    }
}
