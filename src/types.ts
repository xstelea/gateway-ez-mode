export interface TokenInfo {
    resourceAddress: string;
    name: string | null;
    description: string | null;
    symbol: string | null;
    iconUrl: string | null;
}


export interface FungibleResourceBalance {
    token: TokenInfo;
    balance: string;
}