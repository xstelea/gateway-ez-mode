import { GatewayApiClient } from "@radixdlt/babylon-gateway-api-sdk"
import { getBalancesForAccount as getFungibleBalancesForAccount } from "./accountBalances"
import { FungibleResourceBalance } from "./types"



export class GatewayEzMode {
    gateway: GatewayApiClient
    constructor(gateway?: GatewayApiClient) {
        if (gateway) {
            this.gateway = gateway
        } else {
            this.gateway = GatewayApiClient.initialize({
                applicationName: '',
                networkId: 1,
            })
        }
    }

    async getAllFungibleAccountBalances(accountAddress: string): Promise<FungibleResourceBalance[]> {
        return getFungibleBalancesForAccount(this.gateway, accountAddress)
    }
}