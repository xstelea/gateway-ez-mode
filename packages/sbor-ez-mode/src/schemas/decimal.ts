import { ProgrammaticScryptoSborValue } from '@radixdlt/babylon-gateway-api-sdk';
import { SborError, SborSchema } from '../sborSchema';

// Primitive schemas
export class DecimalSchema extends SborSchema<string> {
    constructor() {
        super(['Decimal', 'PreciseDecimal']);
    }

    validate(value: ProgrammaticScryptoSborValue, path: string[]): boolean {
        if (value.kind !== 'Decimal') {
            throw new SborError('Invalid decimal', path);
        }
        return true;
    }

    parse(value: ProgrammaticScryptoSborValue, path: string[]): string {
        this.validate(value, path);
        if (value.kind !== 'Decimal') {
            throw new SborError('Invalid decimal', path);
        }
        return value.value;
    }
}
