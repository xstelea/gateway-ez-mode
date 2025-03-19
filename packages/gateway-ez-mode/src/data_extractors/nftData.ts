import { SborSchema } from '@calamari-radix/sbor-ez-mode';
import { SborError } from '@calamari-radix/sbor-ez-mode';
import {
    ProgrammaticScryptoSborValue,
    StateNonFungibleDetailsResponseItem,
} from '@radixdlt/babylon-gateway-api-sdk';
import { err, Result } from 'neverthrow';

export function extractStringNftData(
    nftDataItem: StateNonFungibleDetailsResponseItem,
    fieldname: string
): string | null {
    if (!nftDataItem.data) return null;
    if (nftDataItem.data.programmatic_json.kind !== 'Tuple') return null;
    const field = nftDataItem.data.programmatic_json.fields.find(
        (field) => field.field_name == fieldname
    );
    if (!field) return null;
    if (field.kind !== 'String') return null;
    return field.value;
}

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
