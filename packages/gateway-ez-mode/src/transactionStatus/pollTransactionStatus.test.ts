import { describe, it } from 'vitest';
import {
    NetworkId,
    NotarizedTransaction,
    PrivateKey,
    RadixEngineToolkit,
    TransactionBuilder,
    TransactionHeader,
    TransactionManifest,
    generateRandomNonce,
    InstructionsKind,
    Convert,
} from '@radixdlt/radix-engine-toolkit';
import { GatewayEzMode } from '..';
import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';
import { Duration } from 'luxon';

const SOME_RANDOM_SIGNER = new PrivateKey.Ed25519(
    '69366e446ad19a7540b4272c614bbc2b242656815eb03b1d29a53c950201ae76'
);

// This is a minimal stokenet manifest that locks some fee using the faucet component
function minimalStokenetManifest(): string {
    return `
CALL_METHOD
    Address("component_tdx_2_1cptxxxxxxxxxfaucetxxxxxxxxx000527798379xxxxxxxxxyulkzl")
    "lock_fee"
    Decimal("10")
;`;
}

async function createMinimalStokenetTransaction(): Promise<
    [transaction: string, intentHash: string]
> {
    const gateway = GatewayApiClient.initialize({
        applicationName: '',
        networkId: NetworkId.Stokenet,
    });
    const status = await gateway.status.getCurrent();
    const transactionHeader: TransactionHeader = {
        networkId: NetworkId.Stokenet,
        startEpochInclusive: status.ledger_state.epoch,
        endEpochExclusive: status.ledger_state.epoch + 5,
        nonce: await generateRandomNonce(),
        notaryIsSignatory: false,
        notaryPublicKey: SOME_RANDOM_SIGNER.publicKey(),
        tipPercentage: 0,
    };
    const builtManifest: TransactionManifest = {
        instructions: {
            kind: InstructionsKind.String,
            value: minimalStokenetManifest(),
        },
        blobs: [],
    };
    const transaction: NotarizedTransaction =
        await TransactionBuilder.new().then((builder) =>
            builder
                .header(transactionHeader)
                .manifest(builtManifest)
                .sign(SOME_RANDOM_SIGNER)
                .notarize(SOME_RANDOM_SIGNER)
        );

    const intentHash =
        await RadixEngineToolkit.NotarizedTransaction.intentHash(transaction);
    const compiledTransaction =
        await RadixEngineToolkit.NotarizedTransaction.compile(transaction);
    const hexTransaction = Convert.Uint8Array.toHexString(compiledTransaction);

    return [hexTransaction, intentHash.id];
}

describe('transactionPoller', () => {
    it(
        'should successfully be able to poll a stokenet transaction',
        async () => {
            const gateway = new GatewayEzMode(
                GatewayApiClient.initialize({
                    applicationName: '',
                    networkId: NetworkId.Stokenet,
                })
            );

            // Create a minimal transaction that only locks some fee with just a random signer
            const [transaction, intentHash] =
                await createMinimalStokenetTransaction();

            // await submitting before polling
            await gateway.gateway.transaction.innerClient.transactionSubmit({
                transactionSubmitRequest: {
                    notarized_transaction_hex: transaction,
                },
            });

            try {
                console.log('Sending txn with intent hash:', intentHash);
                const status =
                    await gateway.transaction.pollTransactionStatus(intentHash);
                console.log('Successfully got transaction status:', status);
            } catch (status) {
                console.warn('thrown while polling txn status:', status);
            }
        },
        Duration.fromObject({ seconds: 15 }).toMillis()
    );
});
