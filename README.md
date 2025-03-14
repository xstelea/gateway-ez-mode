# gateway-ez-mode

Some helpers on top of the Radix Babylon Gateway TypeScript SDK.

All devs in Radix, whether frontend or backend, surely have written helpers that make it easier to fetch data from the Radix Gateway. While Radix some great SDKs, sometimes you just want a very simple thing like get an account's balances. I would love it if we could collaborate as a community to share these helpers as a common repository of abstractions. Feel free to contribute!

# Installation

`npm install @calamari-radix/gateway-ez-mode`

Find it on [NPM](https://www.npmjs.com/package/@calamari-radix/gateway-ez-mode)

# Features

## Getting Account balances

```ts
const gateway = new GatewayEzMode();
const account = gateway.getAccount(SOME_RANDOM_ACCOUNT);
const fungibleBalances = await account.getFungibleBalances();
console.log(fungibleBalances);

/*
output:
[
    {
        token: {
            resourceAddress: 'resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd',
            name: 'Radix',
            iconUrl: 'https://assets.radixdlt.com/icons/icon-xrd.png',
            symbol: 'XRD',
            description: "The Radix Public Network's native token, used to pay the network's required transaction fees and to secure the network through staking to its validator nodes."
        },
        balance: '22367268.028076063653370021'
    },
    ...
]
*/

const nftBalances = await account.getNftBalances();
console.log(nftBalances);

/*
    {
      resourceInfo: {
        resourceAddress: 'resource_rdx1n2dd0w53zpdlqdz65vpymygj8a60vqnggyuxfpfdldjmy2224x020q',
        name: 'Domain',
        description: 'NFT that represents the domain name you own.',
        symbol: null,
        iconUrl: 'https://rns.foundation/assets/icons/domain-component.png',
        infoUrl: null,
        tags: [ 'domain', 'Radix Name Service' ]
      },
      nftBalance: [
        {
          id: '[43564ecf740b11ea807aa013fa0b5230]',
          keyImageUrl: 'https://qr.rns.foundation/pegging.xrd',
          name: 'pegging.xrd',
          description: null
        }
      ]
    },
    ...
*/
```

## Streaming through transactions

```ts
const gateway = new GatewayEzMode();
const stream = await gateway.getTransactionStream({
    startStateVersion: FROM_STATE_VERSION,
    batchSize: 100,
});
let transactions = await stream.next();
let moreTransactions = await stream.next();
```

## Parsing ProgrammaticScryptoSborValue

The Radix network uses a custom data serialization standard called SBOR for storing on-ledger state. This data format can be represented and consumed as JSON in a special representation called SBOR Programmatic JSON. While the Babylon Gateway SDK has good types for this programmatic JSON, it is quite difficult and time-consuming to parse the values coming from ledger into workable JS/TS values.

This package contains a library inspired by the popular validation library Zod, that makes it easy to write TypeScript schemas for your Scrypto types and parse them into nice javascript objects, arrays, maps etc in one go.

### A simple example:

```ts
// s (for sbor) is the main object you'll have to import to create schemas and parse
import { s } from '@calamari-radix/gateway-ez-mode';

const swapEventSchema = s.struct({
    input_address: s.address(),
    input_amount: s.decimal(),
    output_address: s.address(),
    output_amount: s.decimal(),
    is_success: s.bool(),
});
```

This schema represents the following Rust struct:

```rust
struct SwapEvent {
    input_address: ResourceAddress,
    input_amount: Decimal,
    output_address: ResourceAddress,
    output_amount: Decimal,
    is_success: bool
}
```

The programmatic json might look like this:
Don't be fooled! The `Kind` is `Tuple`, but this is surely a struct!
Scrypto SBOR does not have a Struct Kind natively, it is represented by Tuple.

```json
{
    "fields": [
        {
            "value": "resource_rdx1t5pyvlaas0ljxy0wytm5gvyamyv896m69njqdmm2stukr3xexc2up9",
            "kind": "Reference",
            "type_name": "ResourceAddress",
            "field_name": "input_address"
        },
        {
            "value": "0.003427947474666592",
            "kind": "Decimal",
            "field_name": "input_amount"
        },
        {
            "value": "resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd",
            "kind": "Reference",
            "type_name": "ResourceAddress",
            "field_name": "output_address"
        },
        {
            "value": "522.23800528105807128",
            "kind": "Decimal",
            "field_name": "output_amount"
        },
        {
            "field_name": "is_success",
            "kind": "Bool",
            "value": true
        }
    ],
    "kind": "Tuple",
    "type_name": "SwapEvent"
}
```

Now we can parse this programmatic JSON into our nice schema:

```ts
const result = swapEventSchema.safeParse(example);

// {
//   success: true,
//   data: ...
// }
// or
// {
//   success: false,
//   error: ...
// }

if (result.success) {
    console.log(result.data);
}

// {
//     input_address: 'resource_rdx1t5py...',
//     input_amount: '0.003427947474666592',
//     output_address: 'resource_rdx1tknxxxx...',
//     output_amount: '522.23800528105807128',
//     is_success: true,
// }
```

So now we managed to go from this huge JSON representation to an easy to use, pretty object representation.

# How to contribute?

To prevent wasted time, it would be best to first create an issue describing your idea. If you don't care to wait for my response, it would also be fine to just create a pull request and I wil review it.

Please add some kind of tests for your helper to `index.test.ts` or any new `*.test.ts` file. Tests are automatically run inside of pull requests.

To run all tests locally, run `npm run test`
