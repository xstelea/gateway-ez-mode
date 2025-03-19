import {
    GatewayApiClient,
    ResourceAggregationLevel,
} from '@radixdlt/babylon-gateway-api-sdk';
import { FungibleResourceBalance } from '../types';
import { fetchResourceInformation } from '../resource/information';
import { GatewayError, IncorrectAddressType } from '../error';

/**
 * Get the fungible balances for a component.
 * @param gatewayApi The Radix Gateway API client
 * @param address The address of the component to fetch fungible balances for
 * @returns A list of fungible balances
 * @throws {GatewayError} If an error occurs while fetching data from the Radix Gateway API
 * @throws {IncorrectAddressType} If the address is not actually a component
 */
export async function getFungibleBalancesForComponent(
    gatewayApi: GatewayApiClient,
    address: string
): Promise<FungibleResourceBalance[]> {
    let balances;
    try {
        balances = await gatewayApi.state.innerClient.entityFungiblesPage({
            stateEntityFungiblesPageRequest: {
                address: address,
                aggregation_level: ResourceAggregationLevel.Global,
            },
        });
    } catch (error: any) {
        throw new GatewayError(error);
    }

    let next_cursor = balances.next_cursor;
    while (next_cursor) {
        let nextBalances;
        try {
            nextBalances =
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
        } catch (error: any) {
            throw new GatewayError(error);
        }
        next_cursor = nextBalances.next_cursor;
        balances.items.push(...nextBalances.items);
    }

    const tokenAddresses =
        balances.items.map((item) => item.resource_address) || [];
    let tokenInfoItems;
    try {
        tokenInfoItems = await fetchResourceInformation(
            gatewayApi,
            tokenAddresses
        );
    } catch (error: any) {
        throw new GatewayError(error);
    }

    return balances.items.map((item) => {
        // This should never happen, because in our request we specify that we want global aggregation
        if (item.aggregation_level !== ResourceAggregationLevel.Global) {
            throw new Error('Unexpected aggregation level');
        }
        const tokenInfo = tokenInfoItems.find(
            (tokenInfo) => tokenInfo.resourceAddress == item.resource_address
        );
        // This should never happen, because if we query for a resource address, we should get that resource back
        if (!tokenInfo) {
            throw new Error(
                `Token info not found for resource address ${item.resource_address}`
            );
        }
        if (tokenInfo.type !== 'Fungible') throw new IncorrectAddressType();
        return {
            resourceInfo: tokenInfo,
            balance: item.amount,
        };
    });
}
