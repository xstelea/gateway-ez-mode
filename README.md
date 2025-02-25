# ez-gateway
Some higher-level abstractions on top of the Radix Babylon Gateway TypeScript SDK

# Basic usage

```ts
const account = "account_rdx1cx26ckdep9t0lut3qaz3q8cj9wey3tdee0rdxhc5f0nce64lw5gt70"
const gateway = new GatewayEzMode()
const balances = await gateway.getAllFungibleAccountBalances(account)
console.log(balance)

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