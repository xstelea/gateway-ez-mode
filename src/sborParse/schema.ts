/* eslint-disable @typescript-eslint/no-explicit-any */
import { SborSchema } from './sborSchema';
import { ArraySchema } from './schemas/array';
import { BoolSchema } from './schemas/bool';
import { DecimalSchema } from './schemas/decimal';
import { NumberSchema } from './schemas/number';
import { OrderedTupleSchema, TupleSchema } from './schemas/orderedTuple';
import { AddressSchema } from './schemas/address';
import { StringSchema } from './schemas/string';
import { StructDefinition, StructSchema } from './schemas/struct';
import { ValueSchema } from './schemas/value';
import { EnumSchema, VariantDefinition } from './schemas/enum'; // Add this import
import { NonFungibleLocalIdSchema } from './schemas/nonfungiblelocalid';
import { MapDefinition, MapSchema } from './schemas/map';
import { InternalAddressSchema } from './schemas/internalAddress';
import { InstantSchema } from './schemas/instant';
import { OptionSchema } from './schemas/option';

// Schema factory functions
export const s = {
    decimal: () => new DecimalSchema(),
    string: () => new StringSchema(),
    nonFungibleLocalId: () => new NonFungibleLocalIdSchema(),
    number: () => new NumberSchema(),
    instant: () => new InstantSchema(),
    address: () => new AddressSchema(),
    internalAddress: () => new InternalAddressSchema(),
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
        const T extends VariantDefinition<S>[],
        S extends StructSchema<any> | OrderedTupleSchema<B>,
        B extends TupleSchema,
    >(
        variants: T
    ): EnumSchema<T> => new EnumSchema(variants),
    option: <T extends SborSchema<any>>(itemSchema: T) =>
        new OptionSchema(itemSchema),
    map: <T extends MapDefinition>(definition: T) =>
        new MapSchema<T>(definition),
};
