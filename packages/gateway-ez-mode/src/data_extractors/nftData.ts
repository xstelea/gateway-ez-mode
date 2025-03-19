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

    public getWithSchema<T>(
        schema: SborSchema<T>
    ): Result<T, SborDataExtractorError> {
        if (!this.value) {
            return err('NoValue');
        }
        return schema.safeParse(this.value);
    }
}
