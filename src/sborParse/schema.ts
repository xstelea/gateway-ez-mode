/* eslint-disable @typescript-eslint/no-explicit-any */
import { SborSchema } from './sborSchema';
import { ArraySchema } from './schemas/array';
import { BoolSchema } from './schemas/bool';
import { DecimalSchema } from './schemas/decimal';
import { NumberSchema } from './schemas/number';
import { OrderedTupleSchema } from './schemas/orderedTuple';
import { ResourceAddressSchema } from './schemas/resourceAddress';
import { StringSchema } from './schemas/string';
import { StructDefinition, StructSchema } from './schemas/struct';
import { ValueSchema } from './schemas/value';
import { EnumSchema, VariantDefinition } from './schemas/enum'; // Add this import
import { NonFungibleLocalIdSchema } from './schemas/nonfungiblelocalid';

// Schema factory functions
export const s = {
    decimal: () => new DecimalSchema(),
    string: () => new StringSchema(),
    nonFungibleLocalId: () => new NonFungibleLocalIdSchema(),
    number: () => new NumberSchema(),
    resourceAddress: () => new ResourceAddressSchema(),
    struct: <T extends StructDefinition>(definition: T) =>
        new StructSchema(definition),
    tuple: <const T extends SborSchema<any>[]>(schemas: T) =>
        new OrderedTupleSchema(schemas),
    array: <T extends SborSchema<any, any>>(itemSchema: T) =>
        new ArraySchema<T>(itemSchema),
    bool: () => new BoolSchema(),
    value: () => new ValueSchema(),
    // Add enum factory method
    enum: <
        S extends StructSchema<any> | OrderedTupleSchema<unknown>,
        const T extends VariantDefinition<S>[],
    >(
        variants: T
    ): EnumSchema<T> => new EnumSchema(variants),
    // option is an enum with two variants: None and Some
    option: <T extends SborSchema<any>>(itemSchema: T) =>
        s.enum([
            {
                variant: 'None',
                schema: s.tuple([]),
            },
            {
                variant: 'Some',
                schema: s.tuple([itemSchema]),
            },
        ]),
};
