# gateway-ez-mode
Some higher-level abstractions on top of the Radix Babylon Gateway TypeScript SDK.

All devs in Radix, whether frontend or backend, surely have written helpers that make it easier to fetch data from the Radix Gateway. While Radix some great SDKs, sometimes you just want a very simple thing like get an account's balances. I would love it if we could collaborate as a community to share these helpers as a common repository of abstractions.  Feel free to contribute!

# Installation

`npm install @calamari-radix/gateway-ez-mode`

Find it on [NPM](https://www.npmjs.com/package/@calamari-radix/gateway-ez-mode)

# Basic usage
I have already implemented one helper here, which makes it easier to fetch an account's balances.

```ts
const gateway = new GatewayEzMode()
const account = gateway.getAccount(SOME_RANDOM_ACCOUNT)
const balances = await account.getFungibleBalances()
console.log(balances)

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
```

# How to contribute?

To prevent wasted time, it would be best to first create an issue describing your idea. If you don't care to wait for my response, it would also be fine to just create a pull request and I wil review it.

Please add some kind of tests for your helper to `index.test.ts` or any new `*.test.ts` file. Tests are automatically run inside of pull requests.

To run all tests locally, run `npm run test`