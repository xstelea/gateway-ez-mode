# ez-gateway
Some higher-level abstractions on top of the Radix Babylon Gateway TypeScript SDK

# Basic usage

```ts
const account = "account_rdx1cx26ckdep9t0lut3qaz3q8cj9wey3tdee0rdxhc5f0nce64lw5gt70"
const gateway = new GatewayEzMode
const balances = await gateway.getAllFungibleAccountBalances(account)
for (const balance of balances) {
    console.log(balance)
}
```