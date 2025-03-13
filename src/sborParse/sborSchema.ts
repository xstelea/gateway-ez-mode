import { ProgrammaticScryptoSborValue } from '@radixdlt/babylon-gateway-api-sdk';

// Schema and parsing errors
export class SborError extends Error {
    constructor(
        message: string,
        public readonly path: string[] = []
    ) {
        super(message);
    }
}
export const kinds: [
    'Bool',
    'I8',
    'I16',
    'I32',
    'I64',
    'I128',
    'U8',
    'U16',
    'U32',
    'U64',
    'U128',
    'String',
    'Enum',
    'Array',
    'Bytes',
    'Map',
    'Tuple',
    'Reference',
    'Own',
    'Decimal',
    'PreciseDecimal',
    'NonFungibleLocalId',
] = [
    'Bool',
    'I8',
    'I16',
    'I32',
    'I64',
    'I128',
    'U8',
    'U16',
    'U32',
    'U64',
    'U128',
    'String',
    'Enum',
    'Array',
    'Bytes',
    'Map',
    'Tuple',
    'Reference',
    'Own',
    'Decimal',
    'PreciseDecimal',
    'NonFungibleLocalId',
];

export type SborKind = ProgrammaticScryptoSborValue['kind'];
// Base schema class
export abstract class SborSchema<T, O = T> {
    readonly kinds: SborKind[];

    constructor(kinds: SborKind[]) {
        this.kinds = kinds;
    }

    abstract validate(
        value: ProgrammaticScryptoSborValue,
        path: string[]
    ): boolean;

    abstract parse(value: ProgrammaticScryptoSborValue, path: string[]): T;

    safeParse(
        value: ProgrammaticScryptoSborValue
    ): { success: true; data: O } | { success: false; error: SborError } {
        try {
            const data = this.parse(value, []);
            return { success: true, data: data as unknown as O };
        } catch (error) {
            return { success: false, error: error as SborError };
        }
    }
}
