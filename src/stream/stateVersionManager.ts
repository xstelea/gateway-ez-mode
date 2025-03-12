import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';

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

    private async getCurrentStateVersion() {
        const status = () => {
            try {
                return this.gatewayApi.status.getCurrent();
            } catch {
                console.error('Failed to get current state version');
                return status();
            }
        };
        return (await status()).ledger_state.state_version;
    }

    public getStateVersion() {
        return this.stateVersion
            ? Promise.resolve(this.stateVersion)
            : this.getCurrentStateVersion();
    }

    public setStateVersion(value: number) {
        this.stateVersion = value;
    }
}
