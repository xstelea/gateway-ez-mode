import {
    GatewayApiClient,
    ResourceAggregationLevel,
} from '@radixdlt/babylon-gateway-api-sdk';
import { FungibleResourceBalance } from '../types';
import { extractAllMetadataValues } from '../data_extractors/metadata';

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
    const tokenInfoItems =
        await gatewayApi.state.getEntityDetailsVaultAggregated(tokenAddresses);

    return (
        balances.items.flatMap((item) => {
            if (item.aggregation_level !== ResourceAggregationLevel.Global)
                throw new Error('Unexpected aggregation level');

            const tokenInfoItem = tokenInfoItems.find(
                (tokenInfo) => tokenInfo.address == item.resource_address
            );
            if (!tokenInfoItem) {
                return [];
            }
            if (tokenInfoItem?.details?.type != 'FungibleResource') {
                return [];
            }

            const { symbol, name, description, icon_url, info_url, tags } =
                extractAllMetadataValues(tokenInfoItem.metadata, {
                    symbol: 'String',
                    name: 'String',
                    description: 'String',
                    icon_url: 'Url',
                    info_url: 'Url',
                    tags: 'StringArray',
                });

            return {
                resourceInfo: {
                    resourceAddress: item.resource_address,
                    symbol,
                    name,
                    description,
                    iconUrl: icon_url,
                    infoUrl: info_url,
                    tags,
                },
                balance: item.amount,
            };
        }) || []
    );
}
