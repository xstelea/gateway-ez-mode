import {
    GatewayApiClient,
    NetworkConfigurationResponseWellKnownAddresses,
} from '@radixdlt/babylon-gateway-api-sdk';
import { GatewayError } from '../error';

export class StatusService {
    private gateway: GatewayApiClient;

    constructor(gateway: GatewayApiClient) {
        this.gateway = gateway;
    }

    /**
     * Fetches the current state version of the network.
     * @returns The current state version of the network
     * @throws {GatewayError} If an error occurs while fetching data from the Radix Gateway API
     */
    async getCurrentStateVersion(): Promise<number> {
        let status;
        try {
            status = await this.gateway.status.getCurrent();
        } catch (error: any) {
            throw new GatewayError(error);
        }
        return status.ledger_state.state_version;
    }

    /**
     * Fetches the current epoch of the network
     * @returns The current epoch of the network
     * @throws {GatewayError} If an error occurs while fetching data from the Radix Gateway API
     */
    async getCurrentEpoch(): Promise<number> {
        let status;
        try {
            status = await this.gateway.status.getCurrent();
        } catch (error: any) {
            throw new GatewayError(error);
        }
        return status.ledger_state.epoch;
    }

    /**
     * Get the well-known addresses of the network. This includes things like the XRD address,
     * a bunch of internal packages, the faucet and more.
     * @returns The well-known addresses of the network
     * @throws {GatewayError} If an error occurs while fetching data from the Radix Gateway API
     */
    async getWellKnownAddresses(): Promise<NetworkConfigurationResponseWellKnownAddresses> {
        let config;
        try {
            config = await this.gateway.status.getNetworkConfiguration();
        } catch (error: any) {
            throw new GatewayError(error);
        }
        return config.well_known_addresses;
    }
}
