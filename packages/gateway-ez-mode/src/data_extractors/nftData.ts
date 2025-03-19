import { SborSchema } from '@calamari-radix/sbor-ez-mode';
import { SborError } from '@calamari-radix/sbor-ez-mode';
import { ProgrammaticScryptoSborValue } from '@radixdlt/babylon-gateway-api-sdk';
import { err, Result } from 'neverthrow';

type SborDataExtractorError = 'NoValue' | SborError;

export class SborDataExtractor {
    value?: ProgrammaticScryptoSborValue;

    constructor(value?: ProgrammaticScryptoSborValue) {
        this.value = value;
    }

    /**
     * Can be used to extract NFT data. This function takes in a schema for a Scrypto value,
     * and returns a Result with either the parsed data of that Scrypto value according to the
     * schema, or an error.
     * @param schema A fitting sbor-ez-mode schema for the Scrypto value
     * @returns A Result with either the parsed data or an error
     */
    public getWithSchema<T>(
        schema: SborSchema<T>
    ): Result<T, SborDataExtractorError> {
        if (!this.value) {
            return err('NoValue');
        }
        return schema.safeParse(this.value);
    }
}
