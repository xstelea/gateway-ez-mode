import {
    GatewayApiClient,
    ResourceAggregationLevel,
} from '@radixdlt/babylon-gateway-api-sdk';
import { FungibleResourceBalance } from '../types';
import { fetchResourceInformation } from '../resource/information';

export async function getFungibleBalancesForAccount(
    gatewayApi: GatewayApiClient,
    address: string
): Promise<FungibleResourceBalance[]> {
    const balances = await gatewayApi.state.innerClient.entityFungiblesPage({
        stateEntityFungiblesPageRequest: {
            address: address,
            aggregation_level: ResourceAggregationLevel.Global,
        },
    });

    let next_cursor = balances.next_cursor;
    while (next_cursor) {
        const nextBalances =
            await gatewayApi.state.innerClient.entityFungiblesPage({
                stateEntityFungiblesPageRequest: {
                    address: address,
                    aggregation_level: ResourceAggregationLevel.Global,
                    cursor: next_cursor,
                    at_ledger_state: {
                        state_version: balances.ledger_state.state_version,
                    },
                },
            });
        next_cursor = nextBalances.next_cursor;
        balances.items.push(...nextBalances.items);
    }

    const tokenAddresses =
        balances.items.map((item) => item.resource_address) || [];
    const tokenInfoItems = await fetchResourceInformation(
        gatewayApi,
        tokenAddresses
    );

    return balances.items.map((item) => {
        if (item.aggregation_level !== ResourceAggregationLevel.Global) {
            throw new Error('Unexpected aggregation level');
        }
        const tokenInfo = tokenInfoItems.find(
            (tokenInfo) => tokenInfo.resourceAddress == item.resource_address
        );
        if (!tokenInfo) {
            throw new Error(
                `Token info not found for resource address ${item.resource_address}`
            );
        }
        return {
            resourceInfo: tokenInfo,
            balance: item.amount,
        };
    });
}
