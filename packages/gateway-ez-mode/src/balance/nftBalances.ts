import {
    GatewayApiClient,
    ResourceAggregationLevel,
} from '@radixdlt/babylon-gateway-api-sdk';
import { NftBalance } from '../types';
import { SborDataExtractor } from '../data_extractors/nftData';
import { fetchResourceInformation } from '../resource/information';
import s from '@calamari-radix/sbor-ez-mode';
import { GatewayError, IncorrectAddressType } from '../error';
/**
 * Fetches non-fungible balances for a given address
 * @param gatewayApi The Radix Gateway API client
 * @param address The component address to fetch non-fungible balances for (which may be an account)
 * @returns A list of non-fungible balances
 *
 * @throws {GatewayError} If an error occurs while fetching data from the Radix Gateway API
 * @throws {IncorrectAddressType} If the address of the resource is not of the correct type
 */
export async function getNonFungibleBalancesForComponent(
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
    let nonFungibles;
    try {
        nonFungibles =
            await gatewayApi.state.innerClient.entityNonFungiblesPage({
                stateEntityNonFungiblesPageRequest: request,
            });
    } catch (error: any) {
        throw new GatewayError(error);
    }

    // Fetch additional pages if they exist
    let next_cursor_non_fungibles = nonFungibles.next_cursor;
    while (next_cursor_non_fungibles) {
        let nextBalances;
        try {
            nextBalances =
                await gatewayApi.state.innerClient.entityNonFungiblesPage({
                    stateEntityNonFungiblesPageRequest: {
                        ...request,
                        cursor: next_cursor_non_fungibles,
                        at_ledger_state: {
                            state_version:
                                nonFungibles.ledger_state.state_version,
                        },
                    },
                });
        } catch (error: any) {
            throw new GatewayError(error);
        }
        next_cursor_non_fungibles = nextBalances.next_cursor;
        nonFungibles.items.push(...nextBalances.items);
    }

    // Get token addresses and fetch token details
    const tokenAddresses = nonFungibles.items.map(
        (item) => item.resource_address
    );
    let tokenInfoItems;
    try {
        tokenInfoItems = await fetchResourceInformation(
            gatewayApi,
            tokenAddresses
        );
    } catch (error: any) {
        throw new GatewayError(error);
    }

    const nonFungibleResults = nonFungibles.items.map((item) => {
        // this should never happen because we are querying with AggregationLevel.Vault
        if (item.aggregation_level !== ResourceAggregationLevel.Vault) {
            throw new Error('Unexpected aggregation level');
        }
        const tokenInfoItem = tokenInfoItems.find(
            (tokenInfo) => tokenInfo.resourceAddress == item.resource_address
        );
        // This should never happen because if we query for a resource address, we should get that resource back
        if (!tokenInfoItem) {
            throw new Error(
                `Token info not found for resource address ${item.resource_address}`
            );
        }
        if (tokenInfoItem.type !== 'NonFungible')
            throw new IncorrectAddressType();

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
            let nftData;
            try {
                nftData = await gatewayApi.state.innerClient.nonFungibleData({
                    stateNonFungibleDataRequest: {
                        non_fungible_ids: item.vaults.items.flatMap(
                            (item) => item.items || []
                        ),
                        resource_address: item.resource_address,
                        at_ledger_state: {
                            state_version:
                                nonFungibles.ledger_state.state_version,
                        },
                    },
                });
            } catch (error: any) {
                throw new GatewayError(error);
            }

            const parsed = nftData.non_fungible_ids.map((item) => {
                if (!item.data?.programmatic_json) {
                    return {
                        id: item.non_fungible_id,
                        keyImageUrl: null,
                        name: null,
                        description: null,
                        nftData: null,
                    };
                }
                const sborExtractor = new SborDataExtractor(
                    item.data?.programmatic_json
                );

                const { key_image_url, name, description } = sborExtractor
                    .getWithSchema(
                        s.structNullable({
                            key_image_url: s.string(),
                            name: s.string(),
                            description: s.string(),
                        })
                    )
                    .unwrapOr({
                        key_image_url: null,
                        name: null,
                        description: null,
                    });
                return {
                    id: item.non_fungible_id,
                    keyImageUrl: key_image_url,
                    name: name,
                    description: description,
                    nftData: sborExtractor,
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
