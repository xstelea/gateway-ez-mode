import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';
import { getFungibleBalancesForComponent } from '../balance/fungibleBalances';
import {
    ComponentInfo,
    FungibleResourceBalance,
    NftBalance,
    ResourceInfo,
} from '../types';
import { getNonFungibleBalancesForComponent } from '../balance/nftBalances';
import { fetchResourceInformation } from '../resource/information';
import { fetchComponentInformation } from '../component/component';

export class StateService {
    private gateway: GatewayApiClient;
    constructor(gateway: GatewayApiClient) {
        this.gateway = gateway;
    }

    /**
     * Fetches fungible balances for a given component address.
     * @param address The address of the component to fetch fungible balances for
     * @returns A list of fungible balances
     * @throws {GatewayError} If an error occurs while fetching from the Radix Gateway.
     * @throws {IncorrectAddressType} If the address is not of the correct
     * type.
     */
    async getComponentFungibleBalances(
        address: string
    ): Promise<FungibleResourceBalance[]> {
        return getFungibleBalancesForComponent(this.gateway, address);
    }

    /**
     * Fetches non-fungible balances for a given component address.
     * @param address The address of the component to fetch non-fungible balances for
     * @returns A list of non-fungible balances
     * @throws {GatewayError} If an error occurs while fetching from the Radix Gateway.
     * @throws {IncorrectAddressType} If the address is not of the correct type.
     */
    async getComponentNonFungibleBalances(
        address: string
    ): Promise<NftBalance[]> {
        return getNonFungibleBalancesForComponent(this.gateway, address);
    }

    /**
     * Fetches information about a resource, like name, symbol, description, etc.
     * @param resourceAddress

     * @throws {GatewayError} If an error occurs while fetching the information.
     * @throws {IncorrectAddressType} If the resource returned by the gateway call is not actually a resource.
     * @throws {MissingFieldError} If a field that was expected to be present was missing.
     */
    async getResourceInfo(resourceAddress: string): Promise<ResourceInfo> {
        return (
            await fetchResourceInformation(this.gateway, [resourceAddress])
        )[0];
    }

    /**
     * Fetches information about multiple resources in a single call.
     * @param resourceAddresses
     * @returns The resource information
     * @throws {GatewayError} If an error occurs while fetching the information.
     * @throws {IncorrectAddressType} If the resource returned by the gateway call is not actually a resource.
     * @throws {MissingFieldError} If a field that was expected to be present was missing.
     */
    async getResourceInfoBatch(
        resourceAddresses: string[]
    ): Promise<ResourceInfo[]> {
        return fetchResourceInformation(this.gateway, resourceAddresses);
    }

    /**
     * Fetches information about a component, like name, description, etc.
     * This can be any Radix component, including accounts and other special components.
     * @param address The address of the component
     * @returns The component information
     * @throws {GatewayError} If an error occurs while fetching the information.
     * @throws {IncorrectAddressType} If the resource returned by the gateway call is not actually a component.
     */
    async getComponentInfo(address: string): Promise<ComponentInfo> {
        return (await fetchComponentInformation(this.gateway, [address]))[0];
    }

    /**
     * Fetches information about multiple components in a single call.
     * @param addresses The addresses of the components
     * @returns The component information
     * @throws {GatewayError} If an error occurs while fetching the information.
     * @throws {IncorrectAddressType} If the resource returned by the gateway call is not actually a component.
     */
    getComponentInfoBatch(addresses: string[]) {
        return fetchComponentInformation(this.gateway, addresses);
    }
}
