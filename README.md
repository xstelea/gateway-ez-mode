# gateway-ez-mode

Some higher-level abstractions on top of the Radix Babylon Gateway TypeScript SDK.

All devs in Radix, whether frontend or backend, surely have written helpers that make it easier to fetch data from the Radix Gateway. While Radix some great SDKs, sometimes you just want a very simple thing like get an account's balances. I would love it if we could collaborate as a community to share these helpers as a common repository of abstractions. Feel free to contribute!

# Installation

`npm install @calamari-radix/gateway-ez-mode`

Find it on [NPM](https://www.npmjs.com/package/@calamari-radix/gateway-ez-mode)

# Example usage

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

# How to contribute?

To prevent wasted time, it would be best to first create an issue describing your idea. If you don't care to wait for my response, it would also be fine to just create a pull request and I wil review it.

Please add some kind of tests for your helper to `index.test.ts` or any new `*.test.ts` file. Tests are automatically run inside of pull requests.

To run all tests locally, run `npm run test`
