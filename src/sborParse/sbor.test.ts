import { describe, it } from 'vitest';
import { boingEvents, complex, swapEvent } from './programatic-json';
import { s } from './schema';
import { SborParser } from './parser';

// Example usage:
describe('boing', () => {
    it('parse a complex example', async () => {
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
        const parser = new SborParser();
        const result = parser.safeParse(complex, schema);

        // if (result.success) {
        //     result.data.updates.forEach((update) => {
        //         console.log(update[1]);
        //     });
        // }

        console.log(JSON.stringify(result, null, 2));
    });

    it('parse a simpler exmaple', async () => {
        const schema = s.struct({
            input_address: s.resourceAddress(),
            input_amount: s.decimal(),
            output_address: s.resourceAddress(),
            output_amount: s.decimal(),
            input_fee_lp: s.bool(),
        });

        const parser = new SborParser();

        const result = parser.safeParse(swapEvent, schema);
        if (result.success) {
            // result.data
        }

        console.log(JSON.stringify(result, null, 2));
    });

    it('parse an enum', async () => {
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

        const parser = new SborParser();

        boingEvents.forEach((event) => {
            const result = parser.safeParse(event, schema);
            // console.log('result', result);
            // if (result.success) {
            //     console.log(JSON.stringify(result.data, null, 2));
            // }
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
            }
            console.log(JSON.stringify(result, null, 2));
        });
    });
});
