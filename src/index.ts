import {
  GatewayApiClient,
  TransactionStatusResponse,
} from "@radixdlt/babylon-gateway-api-sdk";
import { Account } from "./account";
import {
  PollTransactionStatusOptions,
  pollTransactionStatus,
} from "./pollTransactionStatus";

// Please add methods to this class to extend the functionality
export class GatewayEzMode {
  gateway: GatewayApiClient;
  constructor(gateway?: GatewayApiClient) {
    if (gateway) {
      this.gateway = gateway;
    } else {
      this.gateway = GatewayApiClient.initialize({
        applicationName: "",
        networkId: 1,
      });
    }
  }

  getAccount(address: string): Account {
    return new Account(address, this.gateway);
  }

  pollTransactionStatus(
    transactionId: string,
    options?: Omit<PollTransactionStatusOptions, "gatewayApiClient">
  ): Promise<TransactionStatusResponse> {
    return pollTransactionStatus(transactionId, {
      ...(options || {}),
      gatewayApiClient: this.gateway,
    });
  }
}
