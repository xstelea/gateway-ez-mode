import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';

export function defaultGatewayClient() {
    return GatewayApiClient.initialize({
        applicationName: '',
        networkId: 1,
    });
}
