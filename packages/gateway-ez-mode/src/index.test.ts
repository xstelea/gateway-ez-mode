import { describe, it, expect, assert } from 'vitest';
import { GatewayEzMode, s } from '.';
import { ResourceInfo } from './types';

const RATTA_RESOURCE =
    'resource_rdx1t5wuuwfg3uk2y5l88rya553t3v4zyepf7wjekphryw6yepedyf7pug';
const SOME_RANDOM_ACCOUNT =
    'account_rdx1cx26ckdep9t0lut3qaz3q8cj9wey3tdee0rdxhc5f0nce64lw5gt70';
const DELETED_RATTA_ACCOUNT =
    'account_rdx12xru8aww4w73rr7r3wrc9nk428jr93efxvwtazen7hs3u43cyl5ssv';

const prettyPrint = (obj: any) => console.log(JSON.stringify(obj, null, 2));

describe('gatewaySdk', () => {
    it('should initialize correctly', () => {
        new GatewayEzMode();
    });

    it('should be able to get the gateways status', async () => {
        const gateway = new GatewayEzMode();
        try {
            await gateway.gateway.status.getCurrent();
        } catch (err) {
            console.error(err);
        }
    });
    it('should be able to get current state version', async () => {
        const gateway = new GatewayEzMode();
        await gateway.status.getCurrentStateVersion();
    });

    it('should not error when I ask for an accounts balances', async () => {
        const gateway = new GatewayEzMode();
        const balances =
            await gateway.state.getComponentFungibleBalances(
                SOME_RANDOM_ACCOUNT
            );
        console.log(balances[0]);
        expect(balances).toBeDefined();
    });

    // I put 1 RÅTTA in this account and then deleted access to it on-ledger so this test should always pass
    it('should see 1 ratta in this account', async () => {
        const gateway = new GatewayEzMode();
        const balances = await gateway.state.getComponentFungibleBalances(
            DELETED_RATTA_ACCOUNT
        );
        expect(balances).toBeDefined();
        const rattaBalance = balances.find(
            (balance) => balance.resourceInfo.resourceAddress === RATTA_RESOURCE
        );
        if (!rattaBalance) {
            throw new Error('No ratta balance found');
        }
        expect(rattaBalance.balance).toBe('1');
        expect(rattaBalance.resourceInfo.resourceAddress).toBe(RATTA_RESOURCE);
    });

    it('Should be able to get balance of a component', async () => {
        const componentAddress =
            'component_rdx1crc4fxqecgzjr0ayh590jf5vyxqz4npae68a4fpt2esmlh8jx3d4lv';
        const gateway = new GatewayEzMode();
        const balances =
            await gateway.state.getComponentFungibleBalances(componentAddress);

        if (!balances) {
            throw new Error('No component balance found');
        }
        console.log(balances);
    });

    // get nfts for an account
    it('should be able to get nft balances', async () => {
        const gateway = new GatewayEzMode();
        const balances =
            await gateway.state.getComponentNonFungibleBalances(
                SOME_RANDOM_ACCOUNT
            );
        prettyPrint(balances[0]);
        const nftData = balances[0].nftBalance[0].nftData.getWithSchema(
            s.structNullable({
                key_image_url: s.string(),
                name: s.string(),
                description: s.string(),
            })
        );
        console.log(nftData);
    });

    it("should be able to fetch ratta's info", async () => {
        const gateway = new GatewayEzMode();
        const info: ResourceInfo =
            await gateway.state.getResourceInfo(RATTA_RESOURCE);
        if (info.type == 'Fungible') {
            console.log(info);
        }
        console.log(info);
    });

    it('should be able to get xrd domain', async () => {
        const gateway = new GatewayEzMode();
        const domains = await gateway.domains.getXrdDomainsForComponent(
            'account_rdx12xl2meqtelz47mwp3nzd72jkwyallg5yxr9hkc75ac4qztsxulfpew'
        );
        console.log(domains);
    });

    it('should be able to get component information', async () => {
        const gateway = new GatewayEzMode();
        const info = await gateway.state.getComponentInfo(
            'component_rdx1cr3psyfptwkktqusfg8ngtupr4wwfg32kz2xvh9tqh4c7pwkvlk2kn'
        );
        const schema = s.tuple([s.internalAddress()]);
        const state = info.state.getWithSchema(schema);
        assert(state.isOk());
        expect(state.value?.[0]).toBe(
            'internal_keyvaluestore_rdx1krgydklt34smhcfg6fmqgg3jwluhhngh4rrh3xdx0qld4ep7k3r82s'
        );
    });
});
