import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';
import { FungibleResourceBalance, NftBalance } from './types';
import { getFungibleBalancesForAccount } from './balance/fungibleAccountBalances';
import { getNonFungibleBalancesForAccount } from './balance/nftBalances';
import { defaultGatewayClient } from './gatewayClient';

/**
 * Represents a Radix Account.
 * Provides methods to fetch information related to this Account.
 */
export class Account {
    private gateway: GatewayApiClient;
    address: string;

    /**
     * Creates a new Account instance.
     * @param address The address of the account.
     * @param gateway Optional GatewayApiClient instance to use for API calls
     */
    constructor(
        address: string,
        gateway: GatewayApiClient = defaultGatewayClient()
    ) {
        this.gateway = gateway;
        this.address = address;
    }

    getFungibleBalances(): Promise<FungibleResourceBalance[]> {
        return getFungibleBalancesForAccount(this.gateway, this.address);
    }

    getNftBalances(): Promise<NftBalance[]> {
        return getNonFungibleBalancesForAccount(this.gateway, this.address);
    }
}
