import {
    ProgrammaticScryptoSborValue,
    ProgrammaticScryptoSborValueTuple,
} from '@radixdlt/babylon-gateway-api-sdk';
import { SborError, SborSchema } from '../sborSchema';

// Tuple schema (acting like a struct)
export interface StructDefinition {
    [key: string]: SborSchema<unknown, unknown>;
}

export type ParsedType<T extends SborSchema<unknown>> =
    T extends SborSchema<infer U, unknown> ? U : never;
export type OutputType<T extends SborSchema<unknown>> =
    T extends SborSchema<unknown, infer O> ? O : never;

export class StructSchema<T extends StructDefinition> extends SborSchema<
    { [K in keyof T]: ParsedType<T[K]> },
    { [K in keyof T]: OutputType<T[K]> }
> {
    private definition: T;

    constructor(definition: T) {
        super(['Tuple']);
        this.definition = definition;
    }

    validate(value: ProgrammaticScryptoSborValue, path: string[]): boolean {
        if (
            !value ||
            typeof value !== 'object' ||
            !('kind' in value) ||
            value.kind !== 'Tuple'
        ) {
            throw new SborError('Invalid tuple structure', path);
        }

        const tupleValue = value as ProgrammaticScryptoSborValueTuple;
        const fields = tupleValue.fields;
        const definedFields = Object.keys(this.definition);

        // Check if all required fields are present
        const fieldNames = fields.map((f) => f.field_name).filter(Boolean);
        const missingFields = definedFields.filter(
            (name) => !fieldNames.includes(name)
        );
        if (missingFields.length > 0) {
            throw new SborError(
                `Missing required fields: ${missingFields.join(', ')}`,
                path
            );
        }

        // Validate each field by name
        return definedFields.every((name) => {
            // Find the field by name
            const field = fields.find((f) => f.field_name === name);
            if (!field) {
                throw new SborError(`Missing field: ${name}`, [...path, name]);
            }

            const schema = this.definition[name];
            if (!schema.kinds.includes(field.kind)) {
                throw new SborError(
                    `Expected kind ${schema.kinds} for field ${name}, got ${field.kind}`,
                    [...path, name]
                );
            }

            return schema.validate(field, [...path, name]);
        });
    }

    parse(
        value: ProgrammaticScryptoSborValue,
        path: string[]
    ): { [K in keyof T]: ParsedType<T[K]> } {
        this.validate(value, path);
        const tupleValue = value as ProgrammaticScryptoSborValueTuple;
        const fields = tupleValue.fields;
        const result: Partial<{ [K in keyof T]: ParsedType<T[K]> }> = {};

        Object.entries(this.definition).forEach(([name, schema]) => {
            const field = fields.find((f) => f.field_name === name);
            if (field) {
                result[name as keyof T] = schema.parse(field, [
                    ...path,
                    name,
                ]) as ParsedType<T[keyof T]>;
            }
        });

        return result as { [K in keyof T]: ParsedType<T[K]> };
    }
}
