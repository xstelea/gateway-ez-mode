import { EntityMetadataCollection, GatewayApiClient, ResourceAggregationLevel } from "@radixdlt/babylon-gateway-api-sdk";
import { FungibleResourceBalance } from "./types";



function extractStringMetadata(metadataItems: EntityMetadataCollection, key: string): string | null {
    const item = metadataItems.items.find((item) => item.key == key);
    if (!item) return null;
    if (item.value.typed.type !== "String") return null;
    return item.value.typed.value;
}

function extractUrlMetadata(metadataItems: EntityMetadataCollection, key: string): string | null {
    const item = metadataItems.items.find((item) => item.key == key);
    if (!item) return null;
    if (item.value.typed.type !== "Url") return null;
    return item.value.typed.value;
}

export async function getBalancesForAccount(gatewayApi: GatewayApiClient, address: string): Promise<FungibleResourceBalance[]> {
    const balances = await gatewayApi.state.innerClient.entityFungiblesPage({
        stateEntityFungiblesPageRequest: {
            address: address,
            aggregation_level: ResourceAggregationLevel.Global,
        }
    });

    let next_cursor = balances.next_cursor;
    while (next_cursor) {
        const nextBalances = await gatewayApi.state.innerClient.entityFungiblesPage({
            stateEntityFungiblesPageRequest: {
                address: address,
                aggregation_level: ResourceAggregationLevel.Global,
                cursor: next_cursor,
                at_ledger_state: {
                    state_version: balances.ledger_state.state_version
                }
            }
        });
        next_cursor = nextBalances.next_cursor;
        balances.items.push(...nextBalances.items);
    }

    const tokenAddresses = balances.items.map((item) => item.resource_address) || [];
    const tokenInfoItems = await gatewayApi.state.getEntityDetailsVaultAggregated(tokenAddresses);

    return balances.items.flatMap((item) => {
        if (item.aggregation_level == ResourceAggregationLevel.Global) {
            const tokenInfoItem = tokenInfoItems.find(tokenInfo => tokenInfo.address == item.resource_address);
            if (!tokenInfoItem) {
                return [];
            }
            if (tokenInfoItem?.details?.type != "FungibleResource") {
                return [];
            }

            const tokenSymbol = extractStringMetadata(tokenInfoItem.metadata, "symbol");
            const tokenName = extractStringMetadata(tokenInfoItem.metadata, "name");
            const tokenDescription = extractStringMetadata(tokenInfoItem.metadata, "description");
            const tokenIcon = extractUrlMetadata(tokenInfoItem.metadata, "icon_url");

            return {
                token: {
                    resourceAddress: item.resource_address,
                    name: tokenName,
                    iconUrl: tokenIcon,
                    symbol: tokenSymbol,
                    description: tokenDescription
                },
                balance: item.amount
            }
        }
        else {
            throw new Error('Unsupported aggregation level');
        }

    }) || [];
}