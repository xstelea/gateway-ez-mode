import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';
import { defaultGatewayClient } from './gatewayClient';

import s from '@calamari-radix/sbor-ez-mode';
import { StateService } from './services/state';
import { DomainService } from './services/domain';
import { StatusService } from './services/status';
import { TransactionService } from './services/transaction';
import { StreamService } from './services/stream';

/**
 * A wrapper around the GatewayApiClient that provides
 * a more user-friendly interface for common tasks.
 */
export class GatewayEzMode {
    /**
     * The GatewayApiClient instance used for API calls.
     * @remarks It's public, so you can use it if you need more advanced gateway usage.
     */
    gateway: GatewayApiClient;

    /**
     * A service for querying state-related data.
     */
    state: StateService;
    /**
     * A service for querying information related to XRD Domains.
     */
    domains: DomainService;
    /**
     * A service for querying gateway or netrowk status.
     */
    status: StatusService;
    /**
     * A service for transaction-related operations.
     */
    transaction: TransactionService;
    /**
     * A service related to streaming transaction data.
     */
    stream: StreamService;

    /**
     * Creates a new GatewayEzMode instance.
     * @param gateway Optional GatewayApiClient instance to use for API calls.
     */
    constructor(gateway?: GatewayApiClient) {
        if (gateway) {
            this.gateway = gateway;
        } else {
            this.gateway = defaultGatewayClient();
        }
        this.state = new StateService(this.gateway);
        this.domains = new DomainService(this.state);
        this.status = new StatusService(this.gateway);
        this.transaction = new TransactionService(this.gateway);
        this.stream = new StreamService(this.gateway);
    }
}

export { s };
export { MetadataExtractor } from './data_extractors/metadata';
export * from './error';
