import {
    GatewayApiClient,
    ResourceAggregationLevel,
} from '@radixdlt/babylon-gateway-api-sdk';
import { NftBalance } from '../types';
import { extractStringNftData } from '../data_extractors/nftData';
import { fetchResourceInformation } from '../resource/information';

export async function getNonFungibleBalancesForAccount(
    gatewayApi: GatewayApiClient,
    address: string
): Promise<NftBalance[]> {
    // Define request for non-fungible resources
    const request = {
        address: address,
        aggregation_level: ResourceAggregationLevel.Vault,
        opt_ins: {
            non_fungible_include_nfids: true,
        },
    };

    // Fetch first page of non-fungible resources
    const nonFungibles =
        await gatewayApi.state.innerClient.entityNonFungiblesPage({
            stateEntityNonFungiblesPageRequest: request,
        });

    // Fetch additional pages if they exist
    let next_cursor_non_fungibles = nonFungibles.next_cursor;
    while (next_cursor_non_fungibles) {
        const nextBalances =
            await gatewayApi.state.innerClient.entityNonFungiblesPage({
                stateEntityNonFungiblesPageRequest: {
                    ...request,
                    cursor: next_cursor_non_fungibles,
                    at_ledger_state: {
                        state_version: nonFungibles.ledger_state.state_version,
                    },
                },
            });
        next_cursor_non_fungibles = nextBalances.next_cursor;
        nonFungibles.items.push(...nextBalances.items);
    }

    // Get token addresses and fetch token details
    const tokenAddresses = nonFungibles.items.map(
        (item) => item.resource_address
    );
    const tokenInfoItems = await fetchResourceInformation(
        gatewayApi,
        tokenAddresses
    );

    const nonFungibleResults = nonFungibles.items.map((item) => {
        if (item.aggregation_level !== ResourceAggregationLevel.Vault) {
            throw new Error('Unexpected aggregation level');
        }
        const tokenInfoItem = tokenInfoItems.find(
            (tokenInfo) => tokenInfo.resourceAddress == item.resource_address
        );
        if (!tokenInfoItem) {
            throw new Error(
                `Token info not found for resource address ${item.resource_address}`
            );
        }
        const nonFungibleIds = item.vaults.items.flatMap(
            (item) => item.items || []
        );
        return (async (): Promise<NftBalance> => {
            if (nonFungibleIds.length == 0) {
                return {
                    resourceInfo: tokenInfoItem,
                    nftBalance: [],
                };
            }
            const nftData = await gatewayApi.state.innerClient.nonFungibleData({
                stateNonFungibleDataRequest: {
                    non_fungible_ids: item.vaults.items.flatMap(
                        (item) => item.items || []
                    ),
                    resource_address: item.resource_address,
                    at_ledger_state: {
                        state_version: nonFungibles.ledger_state.state_version,
                    },
                },
            });

            const parsed = nftData.non_fungible_ids.map((item) => {
                const keyImageUrl = extractStringNftData(item, 'key_image_url');
                const name = extractStringNftData(item, 'name');
                const description = extractStringNftData(item, 'description');
                return {
                    id: item.non_fungible_id,
                    keyImageUrl,
                    name,
                    description,
                };
            });

            return {
                resourceInfo: tokenInfoItem,
                nftBalance: parsed,
            } as NftBalance;
        })();
    });

    return Promise.all(nonFungibleResults);
}
