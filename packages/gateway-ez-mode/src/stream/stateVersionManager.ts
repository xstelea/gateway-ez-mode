import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';
import { GatewayError } from '../error';

export class StateVersionManager {
    private stateVersion?: number;
    private gatewayApi: GatewayApiClient;

    constructor({
        gatewayApi,
        startStateVersion,
    }: {
        gatewayApi: GatewayApiClient;
        startStateVersion?: number;
    }) {
        this.gatewayApi = gatewayApi;
        this.stateVersion = startStateVersion;
    }

    /**
     * @returns The current state version of the Radix network.
     * @throws {GatewayError} If an error occurs while fetching.
     */
    private async getCurrentStateVersion() {
        let status;
        try {
            status = await this.gatewayApi.status.getCurrent();
        } catch (error: any) {
            throw new GatewayError(error);
        }
        return status.ledger_state.state_version;
    }

    /**
     * Get the current state version.
     * @throws {GatewayError} If an error occurs while fetching data from the Radix Gateway API
     */
    public getStateVersion() {
        return this.stateVersion
            ? Promise.resolve(this.stateVersion)
            : this.getCurrentStateVersion();
    }

    public setStateVersion(value: number) {
        this.stateVersion = value;
    }
}
