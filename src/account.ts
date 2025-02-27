import { GatewayApiClient } from "@radixdlt/babylon-gateway-api-sdk";
import { FungibleResourceBalance } from "./types";
import { getFungibleBalancesForAccount } from "./accountBalances";

export class Account {
    private gateway: GatewayApiClient;
    address: string;

    constructor(address: string, gateway: GatewayApiClient = GatewayApiClient.initialize({ applicationName: '', networkId: 1 })) {
        this.gateway = gateway;
        this.address = address;
    }

    getFungibleBalances(): Promise<FungibleResourceBalance[]> {
        return getFungibleBalancesForAccount(this.gateway, this.address)
    }
}