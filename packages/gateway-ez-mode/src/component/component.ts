import {
    GatewayApiClient,
    ProgrammaticScryptoSborValue,
} from '@radixdlt/babylon-gateway-api-sdk';
import { ComponentInfo, ComponentMetadata } from '../types';
import { MetadataExtractor } from '../data_extractors/metadata';
import { SborDataExtractor } from '../data_extractors/nftData';
import {
    GatewayError,
    IncorrectAddressType,
    MissingFieldError,
} from '../error';

/**
 * Fetch component information from the gateway.
 * @throws {GatewayError} If an error occurs while fetching the information from the gateway API.
 * @throws {IncorrectAddressType} If the resource returned by the gateway call is not actually a component.
 * @throws {MissingFieldError} If no details are returned for a component
 */
export async function fetchComponentInformation(
    gateway: GatewayApiClient,
    componentAddresses: string[]
): Promise<ComponentInfo[]> {
    let tokenInfoItems;
    try {
        tokenInfoItems =
            await gateway.state.getEntityDetailsVaultAggregated(
                componentAddresses
            );
    } catch (error: any) {
        throw new GatewayError(error);
    }

    return tokenInfoItems.flatMap((item) => {
        const metadataExtractor = new MetadataExtractor(item.metadata);
        const { name, description, tags } =
            metadataExtractor.getMetadataValuesBatch({
                name: 'String',
                description: 'String',
                tags: 'StringArray',
            });
        if (!item.details) {
            throw new MissingFieldError();
        }
        if (item.details.type !== 'Component') {
            throw new IncorrectAddressType();
        }
        const metadata: ComponentMetadata = {
            name,
            description,
            tags,
            metadataExtractor,
        };

        const componentInfo: ComponentInfo = {
            componentAddress: item.address,
            metadata,
            blueprintVersion: item.details.blueprint_version || null,
            packageAddress: item.details.package_address || null,
            state: new SborDataExtractor(
                (item.details.state as ProgrammaticScryptoSborValue) ||
                    undefined
            ),
        };
        return componentInfo;
    });
}
