import {
    GatewayApiClient,
    TransactionStatusResponse,
} from '@radixdlt/babylon-gateway-api-sdk';
import {
    pollTransactionStatus,
    PollTransactionStatusOptions,
} from '../transactionStatus/pollTransactionStatus';

export class TransactionService {
    private gateway: GatewayApiClient;

    constructor(gateway: GatewayApiClient) {
        this.gateway = gateway;
    }

    /**
     * Poll the status of a transaction until it is in a 'final' state, either failed or succeeded.
     * @param transactionId The transaction id / intent hash of the transaction to poll.
     * @param options Options for polling.
     * @returns A promise that resolves with the transaction
     * status as soon as the transaction is in a final state.
     *
     * @example
     * ```typescript
     * const transactionId = sendTransaction();
     * let transactionStatus;
     * try {
     *   transactionStatus = await gatewayEzMode.pollTransactionStatus(transactionId);
     * } catch (error) {
     *   console.error('Failed polling:', error);
     * }
     * console.log("Transaction resolved with status:", transactionStatus);
     * ```
     * @throws {TransactionPollingAbortedError} If the polling is aborted.
     * @throws {TransactionPollingTimeoutError} If the polling times out.
     */
    pollTransactionStatus(
        transactionId: string,
        options?: Omit<PollTransactionStatusOptions, 'gatewayApiClient'>
    ): Promise<TransactionStatusResponse> {
        return pollTransactionStatus(transactionId, {
            ...(options || {}),
            gatewayApiClient: this.gateway,
        });
    }
}
