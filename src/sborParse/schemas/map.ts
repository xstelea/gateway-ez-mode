/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    ProgrammaticScryptoSborValue,
    ProgrammaticScryptoSborValueMap,
} from '@radixdlt/babylon-gateway-api-sdk';
import { SborError, SborSchema } from '../sborSchema';
import { ParsedType } from './struct';

export interface MapDefinition {
    key: SborSchema<any, any>;
    value: SborSchema<any, any>;
}

// export type MapDefinition = Map<any, any>

export type MapParsedType<T extends MapDefinition> = {
    key: ParsedType<T['key']>;
    value: ParsedType<T['value']>;
};

export class MapSchema<T extends MapDefinition> extends SborSchema<
    // {
    //     key: ParsedType<T['key']>;
    //     value: ParsedType<T['value']>;
    // }[]
    Map<ParsedType<T['key']>, ParsedType<T['value']>>
> {
    private definition: T;

    constructor(definition: T) {
        super(['Map']);
        this.definition = definition;
    }

    validate(value: ProgrammaticScryptoSborValue, path: string[]): boolean {
        if (
            !value ||
            typeof value !== 'object' ||
            !('kind' in value) ||
            value.kind !== 'Map'
        ) {
            throw new SborError('Invalid map structure', path);
        }

        const entries = value.entries;

        return entries.every((entry, index) => {
            if (!entry.key || !entry.value) {
                throw new SborError('Invalid map entry', [
                    ...path,
                    index.toString(),
                ]);
            }

            return (
                this.definition.key.validate(entry.key, [
                    ...path,
                    index.toString(),
                ]) &&
                this.definition.value.validate(entry.value, [
                    ...path,
                    index.toString(),
                ])
            );
        });
    }

    parse(
        value: ProgrammaticScryptoSborValue,
        path: string[]
    ): Map<ParsedType<T['key']>, ParsedType<T['value']>> {
        this.validate(value, path);
        const mapValue = value as ProgrammaticScryptoSborValueMap;
        const entries = mapValue.entries;

        return new Map(
            entries.map((entry, index) => [
                this.definition.key.parse(entry.key, [
                    ...path,
                    index.toString(),
                ]),
                this.definition.value.parse(entry.value, [
                    ...path,
                    index.toString(),
                ]),
            ])
        );
    }
}
