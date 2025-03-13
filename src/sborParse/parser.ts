import { ProgrammaticScryptoSborValue } from '@radixdlt/babylon-gateway-api-sdk';
import { SborError, SborSchema } from './sborSchema';

// Parser class
export class SborParser {
    parse<T, O>(
        value: ProgrammaticScryptoSborValue,
        schema: SborSchema<T, O>
    ): O {
        if (!value || typeof value !== 'object') {
            throw new SborError('Invalid SBOR JSON');
        }

        if (!schema.kinds.includes(value.kind)) {
            throw new SborError(
                `Expected kind ${schema.kinds}, got ${value.kind}`
            );
        }
        return schema.parse(value, []) as unknown as O;
    }

    safeParse<T, O>(
        value: ProgrammaticScryptoSborValue,
        schema: SborSchema<T, O>
    ): { success: true; data: O } | { success: false; error: SborError } {
        try {
            const data = this.parse(value, schema);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error as SborError };
        }
    }
}
