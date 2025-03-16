import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';
import { ResourceInfo } from '../types';
import { MetadataExtractor } from '../data_extractors/metadata';

export async function fetchResourceInformation(
    gateway: GatewayApiClient,
    resourceAddresses: string[]
): Promise<ResourceInfo[]> {
    const tokenInfoItems =
        await gateway.state.getEntityDetailsVaultAggregated(resourceAddresses);

    return tokenInfoItems.flatMap((item) => {
        const metadataExtractor = new MetadataExtractor(item.metadata);
        const { symbol, name, description, icon_url, info_url, tags } =
            metadataExtractor.extractAllMetadataValues({
                symbol: 'String',
                name: 'String',
                description: 'String',
                icon_url: 'Url',
                info_url: 'Url',
                tags: 'StringArray',
            });

        return {
            resourceAddress: item.address,
            symbol,
            name,
            description,
            iconUrl: icon_url,
            infoUrl: info_url,
            tags,
            getMetadataValue:
                metadataExtractor.extractMetadataValue.bind(metadataExtractor),
            getMetadataValues:
                metadataExtractor.extractAllMetadataValues.bind(
                    metadataExtractor
                ),
        };
    });
}
