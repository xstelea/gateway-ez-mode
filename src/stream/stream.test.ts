import { describe, it } from 'vitest';
import { Duration } from 'luxon';
import { GatewayEzMode } from '..';

describe(
    'stream',
    () => {
        it('should be able to fetch some transactions', async () => {
            const FROM_STATE_VERSION = 242174609;
            const TO_STATE_VERSION = 242189250;
            const gateway = new GatewayEzMode();

            const stream = await gateway.getTransactionStream({
                startStateVersion: FROM_STATE_VERSION,
                batchSize: 100,
            });
            let transactions = await stream.next();
            while (transactions.lastSeenStateVersion < TO_STATE_VERSION) {
                console.log(
                    transactions.transactions.map((tx) => tx.state_version)
                );
                transactions = await stream.next();
                await new Promise((resolve) => setTimeout(resolve, 1000));
                transactions.transactions.forEach((tx) => {
                    tx.receipt?.detailed_events?.forEach((event) => {
                        if (event.identifier.event == 'SwapEvent') {
                            console.log(event);
                        }
                    });
                });
            }
        });
    },
    Duration.fromObject({ seconds: 10 }).toMillis()
);
