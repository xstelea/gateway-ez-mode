/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { boingEvents, complex, swapEvent } from './programatic-json';
import { s } from './schema';
import { ProgrammaticScryptoSborValue } from '@radixdlt/babylon-gateway-api-sdk';
import { SborSchema } from './sborSchema';

function evaluateResultHelper<S extends SborSchema<any>, E>(
    schema: S,
    example: ProgrammaticScryptoSborValue,
    expectedParsedValue: E
) {
    const result = schema.safeParse(example);
    if (result.success) {
        console.log(result.data);
        expect(result.data).toEqual(expectedParsedValue);
    } else {
        console.error(result.error);
        throw new Error('Failed to parse');
    }
}

// Example usage:
describe('boing', () => {
    it('parse a complex example', () => {
        const schema = s.struct({
            updates: s.array(
                s.tuple([
                    s.string(),
                    s.struct({
                        oi_long: s.decimal(),
                        oi_short: s.decimal(),
                        cost: s.decimal(),
                        skew_abs_snap: s.decimal(),
                        pnl_snap: s.decimal(),
                        funding_2_rate: s.decimal(),
                        funding_long_index: s.decimal(),
                        last_update: s.number(),
                    }),
                ])
            ),
        });

        const result = schema.safeParse(complex);

        if (result.success) {
            result.data.updates.forEach((update) => {
                console.log(update[1]);
            });
        } else {
            throw new Error('Failed to parse');
        }

        console.log(JSON.stringify(result, null, 2));
    });

    it('parse a struct', () => {
        const schema = s.struct({
            input_address: s.address(),
            input_amount: s.decimal(),
            output_address: s.address(),
            output_amount: s.decimal(),
            bool_field: s.bool(),
        });

        const result = schema.safeParse(swapEvent);
        if (result.success) {
            console.log(result.data);
            // result.data
        }

        console.log(JSON.stringify(result, null, 2));
    });

    it('parse an enum', () => {
        const schema = s.enum([
            {
                variant: 'Empty',
                schema: s.tuple([]),
            },
            {
                variant: 'StructBased',
                schema: s.struct({
                    name: s.string(),
                }),
            },
            {
                variant: 'StructBasedEmpty',
                schema: s.struct({}),
            },
            {
                variant: 'TupleBased',
                schema: s.tuple([s.string()]),
            },
            {
                variant: 'TupleBasedTwoVals',
                schema: s.tuple([s.string(), s.number()]),
            },
            {
                variant: 'TupleBasedEmpty',
                schema: s.tuple([]),
            },
            {
                variant: 'ContainsOption',
                schema: s.struct({
                    option: s.option(s.string()),
                }),
            },
        ]);

        boingEvents.forEach((event) => {
            const result = schema.safeParse(event);
            if (result.success) {
                switch (result.data.variant) {
                    case 'StructBased':
                        console.log(result.data.value.name);
                        break;
                    case 'TupleBasedTwoVals':
                        console.log(result.data);
                        break;
                    case 'ContainsOption':
                        console.log(result.data.value.option.variant);
                        break;
                }
            } else {
                console.error(result.error);
                throw new Error('Failed to parse');
            }
            console.log(JSON.stringify(result, null, 2));
        });
    });

    it('parse a map', () => {
        const example: ProgrammaticScryptoSborValue = {
            kind: 'Map',
            field_name: 'map',
            key_kind: 'String',
            value_kind: 'String',
            entries: [
                {
                    key: {
                        kind: 'String',
                        value: 'boinoing',
                    },
                    value: {
                        kind: 'String',
                        value: 'boobies',
                    },
                },
                {
                    key: {
                        kind: 'String',
                        value: 'impostor',
                    },
                    value: {
                        kind: 'String',
                        value: 'amogus',
                    },
                },
            ],
        };
        const parsed = [
            {
                key: 'boinoing',
                value: 'boobies',
            },
            {
                key: 'impostor',
                value: 'amogus',
            },
        ];
        const schema = s.map({
            key: s.string(),
            value: s.string(),
        });
        evaluateResultHelper(schema, example, parsed);
    });

    it('parse a kvs address (Own)', () => {
        const example: ProgrammaticScryptoSborValue = {
            kind: 'Own',
            type_name: 'KeyValueStore',
            field_name: 'liq_lock',
            value: 'internal_keyvaluestore_rdx1krcfpw0y5les3c725s5py0aqmecymsagzqvx92sz3ul2ecfmdytjq8',
        };

        const parsed =
            'internal_keyvaluestore_rdx1krcfpw0y5les3c725s5py0aqmecymsagzqvx92sz3ul2ecfmdytjq8';

        const schema = s.internalAddress();

        evaluateResultHelper(schema, example, parsed);
    });

    it('parse a tuple', () => {
        const example: ProgrammaticScryptoSborValue = {
            kind: 'Tuple',
            field_name: 'tuple',
            type_name: 'tuple',
            fields: [
                {
                    kind: 'String',
                    value: 'hello',
                },
                {
                    kind: 'U32',
                    value: '5',
                },
            ],
        };
        const parsed = ['hello', 5];
        const schema = s.tuple([s.string(), s.number()]);

        evaluateResultHelper(schema, example, parsed);
    });

    it('parse a very nested tuple', () => {
        const example: ProgrammaticScryptoSborValue = {
            kind: 'Tuple',
            field_name: 'tuple',
            type_name: 'tuple',
            fields: [
                {
                    kind: 'Tuple',
                    field_name: 'tuple',
                    type_name: 'tuple',
                    fields: [
                        {
                            kind: 'String',
                            value: 'hello',
                        },
                        {
                            kind: 'U32',
                            value: '5',
                        },
                    ],
                },
                {
                    kind: 'Tuple',
                    field_name: 'tuple',
                    type_name: 'tuple',
                    fields: [
                        {
                            kind: 'String',
                            value: 'world',
                        },
                        {
                            kind: 'U32',
                            value: '10',
                        },
                    ],
                },
            ],
        };
        const parsed = [
            ['hello', 5],
            ['world', 10],
        ];

        const schema = s.tuple([
            s.tuple([s.string(), s.number()]),
            s.tuple([s.string(), s.number()]),
        ]);

        evaluateResultHelper(schema, example, parsed);
    });

    it('parse all possible variants of an enum', () => {
        const examples: ProgrammaticScryptoSborValue[] = [
            {
                kind: 'Enum',
                variant_id: '0',
                variant_name: 'Empty',
                fields: [],
            },
            {
                kind: 'Enum',
                variant_id: '1',
                variant_name: 'StructBased',
                fields: [
                    {
                        kind: 'String',
                        field_name: 'name',
                        value: 'daan',
                    },
                ],
            },
            {
                kind: 'Enum',
                variant_id: '2',
                variant_name: 'StructBasedEmpty',
                fields: [],
            },
            {
                kind: 'Enum',
                variant_id: '3',
                variant_name: 'TupleBased',
                fields: [
                    {
                        kind: 'String',
                        value: 'daan',
                    },
                ],
            },
            {
                kind: 'Enum',
                variant_id: '4',
                variant_name: 'TupleBasedTwoVals',
                fields: [
                    {
                        kind: 'String',
                        value: 'daan',
                    },
                    {
                        kind: 'U32',
                        value: '5',
                    },
                ],
            },
            {
                kind: 'Enum',
                variant_id: '5',
                variant_name: 'TupleBasedEmpty',
                fields: [],
            },
            // this one is an enum at the top level, but also contains an option which
            // is also an enum
            {
                kind: 'Enum',
                variant_id: '6',
                variant_name: 'ContainsOption',
                fields: [
                    {
                        field_name: 'option',
                        kind: 'Enum',
                        type_name: 'Option',
                        variant_id: '0',
                        variant_name: 'None',
                        fields: [],
                    },
                ],
            },
            {
                kind: 'Enum',
                variant_id: '6',
                variant_name: 'ContainsOption',
                fields: [
                    {
                        field_name: 'option',
                        kind: 'Enum',
                        type_name: 'Option',
                        variant_id: '1',
                        variant_name: 'Some',
                        fields: [
                            {
                                kind: 'String',
                                value: 'daan',
                            },
                        ],
                    },
                ],
            },
        ];
        const schema = s.enum([
            {
                variant: 'Empty',
                schema: s.tuple([]),
            },
            {
                variant: 'StructBased',
                schema: s.struct({
                    name: s.string(),
                }),
            },
            {
                variant: 'StructBasedEmpty',
                schema: s.struct({}),
            },
            {
                variant: 'TupleBased',
                schema: s.tuple([s.string()]),
            },
            {
                variant: 'TupleBasedTwoVals',
                schema: s.tuple([s.string(), s.number()]),
            },
            {
                variant: 'TupleBasedEmpty',
                schema: s.tuple([]),
            },
            {
                variant: 'ContainsOption',
                schema: s.struct({
                    option: s.option(s.string()),
                }),
            },
        ]);

        const parsed = [
            { variant: 'Empty', value: [] },
            { variant: 'StructBased', value: { name: 'daan' } },
            { variant: 'StructBasedEmpty', value: {} },
            { variant: 'TupleBased', value: ['daan'] },
            { variant: 'TupleBasedTwoVals', value: ['daan', 5] },
            { variant: 'TupleBasedEmpty', value: [] },
            {
                variant: 'ContainsOption',
                value: { option: { variant: 'None' } },
            },
            {
                variant: 'ContainsOption',
                value: { option: { variant: 'Some', value: 'daan' } },
            },
        ];

        examples.forEach((example, i) => {
            evaluateResultHelper(schema, example, parsed[i]);
        });
    });

    it('parse an instant', () => {
        const example: ProgrammaticScryptoSborValue = {
            kind: 'I64',
            type_name: 'Instant',
            field_name: 'end_timestamp',
            value: '1741712929',
        };

        const parsed = new Date(Date.parse('2025-03-11T17:08:49.000Z'));

        const schema = s.instant();
        evaluateResultHelper(schema, example, parsed);
    });

    it('parse a None', () => {
        const example: ProgrammaticScryptoSborValue = {
            kind: 'Enum',
            variant_id: '0',
            variant_name: 'None',
            fields: [],
        };

        const parsed = {
            variant: 'None',
        };

        const schema = s.option(s.string());
        evaluateResultHelper(schema, example, parsed);
    });

    it('parse a Some', () => {
        const example: ProgrammaticScryptoSborValue = {
            kind: 'Enum',
            variant_id: '1',
            variant_name: 'Some',
            fields: [
                {
                    kind: 'Tuple',
                    fields: [
                        {
                            kind: 'String',
                            value: 'hello',
                            field_name: 'boing',
                        },
                    ],
                },
            ],
        };

        const parsed = {
            variant: 'Some',
            value: {
                boing: 'hello',
            },
        };

        const schema = s.option(
            s.struct({
                boing: s.string(),
            })
        );
        const result = schema.safeParse(example);
        if (result.success) {
            console.log(result.data);
            expect(result.data).toEqual(parsed);
        } else {
            console.error(result.error);
            throw new Error('Failed to parse');
        }
        evaluateResultHelper(schema, example, parsed);
    });

    it('parse an array of non fungible local ids', () => {
        const example: ProgrammaticScryptoSborValue = {
            kind: 'Array',
            field_name: 'nft_ids',
            type_name: 'Array',
            element_kind: 'NonFungibleLocalId',
            elements: [
                {
                    kind: 'NonFungibleLocalId',
                    value: '#1#',
                },
                {
                    kind: 'NonFungibleLocalId',
                    value: '#2#',
                },
                {
                    kind: 'NonFungibleLocalId',
                    value: '#3#',
                },
            ],
        };
        const parsed = ['#1#', '#2#', '#3#'];
        const schema = s.array(s.nonFungibleLocalId());

        evaluateResultHelper(schema, example, parsed);
    });
    it('parse a multi-layered structure of doom', () => {
        /**
         * We'll construct a top-level Tuple with:
         * 1) A Struct
         * 2) An Array (of Enums)
         *
         * Inside the Struct we'll have:
         * - A string field 'name'
         * - An array 'complicated_array' which contains a Tuple with [Decimal, Enum, Bool]
         *
         * The second item in the top-level tuple is an Array of Enums, each variant can be different.
         */

        // 1) The monster schema definition
        const schema = s.tuple([
            // The struct part
            s.struct({
                name: s.string(),
                complicated_array: s.array(
                    s.tuple([
                        s.decimal(),
                        s.enum([
                            {
                                variant: 'Empty',
                                schema: s.tuple([]),
                            },
                            {
                                variant: 'StructBased',
                                schema: s.struct({
                                    inner_name: s.string(),
                                    inner_value: s.number(),
                                }),
                            },
                        ]),
                        s.bool(),
                    ])
                ),
            }),
            // The array of enums part
            s.array(
                s.enum([
                    {
                        variant: 'HiddenMessage',
                        schema: s.tuple([s.string()]),
                    },
                    {
                        variant: 'LuckyNumber',
                        schema: s.tuple([s.number()]),
                    },
                ])
            ),
        ]);

        // 2) Example data following the "ProgrammaticScryptoSborValue" shape
        const example: ProgrammaticScryptoSborValue = {
            kind: 'Tuple',
            fields: [
                // The struct portion
                {
                    kind: 'Tuple',
                    fields: [
                        {
                            field_name: 'name',
                            kind: 'String',
                            value: 'A mighty struct indeed',
                        },
                        {
                            field_name: 'complicated_array',
                            kind: 'Array',
                            type_name: 'Array',
                            element_kind: 'Tuple',
                            elements: [
                                {
                                    // Each element is a Tuple
                                    kind: 'Tuple',
                                    fields: [
                                        {
                                            kind: 'Decimal',
                                            value: '42.1234',
                                        },
                                        {
                                            kind: 'Enum',
                                            variant_id: '1',
                                            variant_name: 'StructBased',
                                            fields: [
                                                {
                                                    field_name: 'inner_name',
                                                    kind: 'String',
                                                    value: 'DeepInside',
                                                },
                                                {
                                                    field_name: 'inner_value',
                                                    kind: 'U32',
                                                    value: '999999',
                                                },
                                            ],
                                        },
                                        {
                                            kind: 'Bool',
                                            value: true,
                                        },
                                    ],
                                },
                                {
                                    kind: 'Tuple',
                                    fields: [
                                        {
                                            kind: 'Decimal',
                                            value: '0.0001',
                                        },
                                        {
                                            kind: 'Enum',
                                            variant_id: '0',
                                            variant_name: 'Empty',
                                            fields: [],
                                        },
                                        {
                                            kind: 'Bool',
                                            value: false,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                // Array of enums portion
                {
                    kind: 'Array',
                    type_name: 'Array',
                    element_kind: 'Enum',
                    elements: [
                        {
                            kind: 'Enum',
                            variant_id: '0',
                            variant_name: 'HiddenMessage',
                            fields: [
                                {
                                    kind: 'String',
                                    value: 'secret stuff inside an array of enums',
                                },
                            ],
                        },
                        {
                            kind: 'Enum',
                            variant_id: '1',
                            variant_name: 'LuckyNumber',
                            fields: [
                                {
                                    kind: 'I32',
                                    value: '777',
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const expectedParsedValue = [
            {
                name: 'A mighty struct indeed',
                complicated_array: [
                    [
                        '42.1234', // decimal as string
                        {
                            variant: 'StructBased',
                            value: {
                                inner_name: 'DeepInside',
                                inner_value: 999999,
                            },
                        },
                        true,
                    ],
                    [
                        '0.0001', // decimal as string
                        {
                            variant: 'Empty',
                            value: [],
                        },
                        false,
                    ],
                ],
            },
            [
                {
                    variant: 'HiddenMessage',
                    value: ['secret stuff inside an array of enums'],
                },
                {
                    variant: 'LuckyNumber',
                    value: [777],
                },
            ],
        ];

        evaluateResultHelper(schema, example, expectedParsedValue);
    });
});
