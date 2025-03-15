import { StateVersionManager } from './stateVersionManager';
import {
    CommittedTransactionInfo,
    GatewayApiClient,
} from '@radixdlt/babylon-gateway-api-sdk';
import { defaultGatewayClient } from '../gatewayClient';

// export type TransactionStreamInput = Partial<{
//     gateway: GatewayApiClient;
//     startStateVersion: number;
//     batchSize: number;
// }>;

export interface TransactionStreamInput {
    gateway: GatewayApiClient;
    startStateVersion: number;
    batchSize: number;
    stateVersionManager: StateVersionManager;
}

export interface TransactionStreamOutput {
    lastSeenStateVersion: number;
    transactions: CommittedTransactionInfo[];
}

/**
 * A stream of transactions from the Radix network. Allows you to
 * eaily fetch transactions in chronological order as they are
 * committed to the ledger.
 */
export class TransactionStream {
    gateway: GatewayApiClient;
    startStateVersion: number;
    batchSize: number;

    stateVersionManager: StateVersionManager;

    constructor({
        gateway,
        startStateVersion,
        batchSize,
        stateVersionManager,
    }: TransactionStreamInput) {
        this.gateway = gateway;
        this.startStateVersion = startStateVersion;
        this.batchSize = batchSize;
        this.stateVersionManager = stateVersionManager;
    }

    static async create(
        input: Partial<TransactionStreamInput>
    ): Promise<TransactionStream> {
        if (input.batchSize && input.batchSize > 100) {
            console.warn(
                'Please note that the public Radix Gateway API has a limit of 100 transactions per page'
            );
        }
        const gateway = input.gateway || defaultGatewayClient();

        const stateVersionManager = new StateVersionManager({
            gatewayApi: gateway,
            startStateVersion: input.startStateVersion,
        });

        return new TransactionStream({
            gateway,
            startStateVersion:
                input.startStateVersion ||
                (await stateVersionManager.getStateVersion()),
            batchSize: input.batchSize || 100,
            stateVersionManager,
        });
    }

    /**
     * Get the last seen state version. This is the state version of the last
     * transaction that was fetched from the stream.
     * @returns The last seen state version.
     */
    async lastSeenStateVersion(): Promise<number> {
        return this.stateVersionManager.getStateVersion();
    }

    /**
     * Fetch the next batch of transactions from the stream.
     * @returns A promise that resolves with the next batch of transactions
     * from the stream. Once the stream is caught up with ledger, it may return an empty array
     */
    async next(): Promise<TransactionStreamOutput> {
        const stateVersion = await this.stateVersionManager.getStateVersion();
        const transactions =
            await this.gateway.stream.innerClient.streamTransactions({
                streamTransactionsRequest: {
                    from_ledger_state: {
                        state_version: stateVersion,
                    },
                    order: 'Asc',
                    kind_filter: 'User',
                    opt_ins: {
                        detailed_events: true,
                    },
                    limit_per_page: this.batchSize,
                    transaction_status_filter: 'Success',
                },
            });
        this.stateVersionManager.setStateVersion(
            transactions.items.at(-1)?.state_version || stateVersion
        );
        return {
            transactions: transactions.items.filter(
                (item) => item.state_version > stateVersion
            ),
            lastSeenStateVersion: stateVersion,
        };
    }
}
