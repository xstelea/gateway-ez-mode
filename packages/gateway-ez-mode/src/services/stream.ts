import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';
import {
    TransactionStream,
    TransactionStreamInput,
} from '../stream/transactionStream';

type GetTransactionStreamInput = Partial<
    Omit<TransactionStreamInput, 'gateway' | 'stateVersionManager'>
>;

export class StreamService {
    private gateway: GatewayApiClient;

    constructor(gateway: GatewayApiClient) {
        this.gateway = gateway;
    }

    /**
     *
     * @param startStateVersion The state version to start streaming from.
     * @param batchSize The maximum number of transactions to fetch per call.
     * @returns A promise that resolves with a TransactionStream class instance.
     * @throws {GatewayError} If an error occurs while fetching data from the Radix Gateway API
     */
    async getTransactionStream({
        startStateVersion,
        batchSize,
    }: GetTransactionStreamInput): Promise<TransactionStream> {
        return TransactionStream.create({
            gateway: this.gateway,
            startStateVersion,
            batchSize,
        });
    }
}
