import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';
import { FungibleResourceInfo, ResourceInfo } from '../types';
import { MetadataExtractor } from '../data_extractors/metadata';
import {
    GatewayError,
    IncorrectAddressType,
    MissingFieldError,
} from '../error';

/**
 * Fetch resource information from multiple resources in a single call.
 * @param gateway The gateway client
 * @param resourceAddresses The addresses of the resources to fetch information for
 * @returns The information about the resources
 * @throws {MissingFieldError} If no details are returned for a resource
 * @throws {GatewayError} If an error occurs while fetching the information from the gateway API.
 * @throws {IncorrectAddressType} If the address is not of the correct type
 */
export async function fetchResourceInformation(
    gateway: GatewayApiClient,
    resourceAddresses: string[]
): Promise<ResourceInfo[]> {
    let tokenInfoItems;
    try {
        tokenInfoItems =
            await gateway.state.getEntityDetailsVaultAggregated(
                resourceAddresses
            );
    } catch (error: any) {
        throw new GatewayError(error);
    }

    return tokenInfoItems.flatMap((item) => {
        const metadataExtractor = new MetadataExtractor(item.metadata);
        const { symbol, name, description, icon_url, info_url, tags } =
            metadataExtractor.getMetadataValuesBatch({
                symbol: 'String',
                name: 'String',
                description: 'String',
                icon_url: 'Url',
                info_url: 'Url',
                tags: 'StringArray',
            });
        if (!item.details) {
            throw new MissingFieldError();
        }
        const metadata = {
            name,
            description,
            symbol,
            iconUrl: icon_url,
            infoUrl: info_url,
            tags,
            metadataExtractor,
        };

        if (item.details.type === 'FungibleResource') {
            const resourceInfo: FungibleResourceInfo = {
                resourceAddress: item.address,
                type: 'Fungible',
                divisibility: item.details.divisibility,
                metadata,
                supplyInfo: {
                    totalMinted: item.details.total_minted,
                    totalBurned: item.details.total_burned,
                    totalSupply: item.details.total_supply,
                },
            };
            return resourceInfo;
        } else if (item.details.type === 'NonFungibleResource') {
            const resourceInfo: ResourceInfo = {
                resourceAddress: item.address,
                type: 'NonFungible',
                metadata,
                nonFungibleIdType: item.details.non_fungible_id_type,
                supplyInfo: {
                    totalMinted: item.details.total_minted,
                    totalBurned: item.details.total_burned,
                    totalSupply: item.details.total_supply,
                },
            };
            return resourceInfo;
        } else {
            throw new IncorrectAddressType();
        }
    });
}
