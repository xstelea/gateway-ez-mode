import { NonFungibleIdType } from '@radixdlt/babylon-gateway-api-sdk';
import { MetadataExtractor } from './data_extractors/metadata';
import { SborDataExtractor } from './data_extractors/nftData';

// https://docs.radixdlt.com/docs/metadata-for-wallet-display

export interface ExtraMetadata {
    /**
     * Cam be used to get
     * metadata values from the resource
     * other than the default ones which
     * are already provided.
     */
    metadataExtractor: MetadataExtractor;
}

/**
 * Represents the metadata of a resource.
 * Already contains the metadata values from the
 * resource metadata standard.
 */
export interface FungibleResourceMetadata extends ExtraMetadata {
    name: string | null;
    symbol: string | null;
    description: string | null;
    iconUrl: string | null;
    infoUrl: string | null;
    tags: string[] | null;
}

export type NonFungibleResourceMetadata = Omit<
    FungibleResourceMetadata,
    'symbol'
>;

export interface ComponentMetadata extends ExtraMetadata {
    name: string | null;
    description: string | null;
    tags: string[] | null;
}

export interface ComponentInfo {
    componentAddress: string;
    packageAddress: string | null;
    blueprintVersion: string | null;
    metadata: ComponentMetadata;
    /**
     * Can be used to deserialize the state of the component
     * into a specific schema using sbor-ez-mode.
     */
    state: SborDataExtractor;
}

export interface SupplyInfo {
    totalSupply: string;
    totalMinted: string;
    totalBurned: string;
}

export interface FungibleResourceInfo {
    type: 'Fungible';
    /**
     * The Resource Address of the resource.
     */
    resourceAddress: string;
    /**
     * Divisibility of the resource.
     */
    divisibility: number;
    metadata: FungibleResourceMetadata;
    supplyInfo: SupplyInfo;
}

export interface FungibleResourceBalance {
    /**
     * The resource information of the balance, such as resource address,
     * name, description, and other metadata.
     */
    resourceInfo: FungibleResourceInfo;
    /**
     * The amount of resource
     */
    balance: string;
}

export interface NftResourceInfo {
    type: 'NonFungible';
    resourceAddress: string;
    metadata: NonFungibleResourceMetadata;
    supplyInfo: SupplyInfo;
    nonFungibleIdType: NonFungibleIdType;
}

export type ResourceInfo = FungibleResourceInfo | NftResourceInfo;

/** Represents the balances of one NFT resource */
export interface NftBalance {
    /**
     * The resource information of the balance, such as resource address,
     * name, description, and other metadata.
     */
    resourceInfo: NftResourceInfo;
    /**
     * An array of NFTs that are owned by the entity.
     */
    nftBalance: NftInfo[];
}

/** Represents an NFT */
export interface NftInfo {
    name: string | null;
    description: string | null;
    keyImageUrl: string | null;
    id: string;
    /**
     * Can be used to deserialize the NFT data
     * into a specific schema using sbor-ez-mode.
     */
    nftData: SborDataExtractor;
}
