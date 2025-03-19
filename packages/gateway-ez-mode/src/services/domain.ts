import { StateService } from './state';

export const XRD_DOMAINS_RESOURCE_ADDRESS =
    'resource_rdx1n2dd0w53zpdlqdz65vpymygj8a60vqnggyuxfpfdldjmy2224x020q';

export class DomainService {
    private stateService: StateService;

    constructor(stateService: StateService) {
        this.stateService = stateService;
    }

    /**
     * Get the XRD Domains owned by a component (which may be an account).
     *
     * If your goal is to display the XRD domain for an account, I believe currently the unwritten
     * rule is to use the first one in the list, which corresponds to the first one in the list
     * returned by this method. Do with that what you will.
     * @param address The address of the component
     * @returns An array of XRD Domain names (which may be empty if the component owns no domains)
     * @throws {GatewayError} If an error occurs while fetching data from the Radix Gateway API
     * @throws {IncorrectAddressType} If the address is not actually a component
     */
    async getXrdDomainsForComponent(address: string): Promise<string[]> {
        const balances =
            await this.stateService.getComponentNonFungibleBalances(address);
        const xrdDomains = balances.find(
            (balance) =>
                balance.resourceInfo.resourceAddress ===
                XRD_DOMAINS_RESOURCE_ADDRESS
        );
        return xrdDomains?.nftBalance.map((nft) => nft.name!) || [];
    }
}
