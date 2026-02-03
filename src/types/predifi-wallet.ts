// User's connected wallet (authentication layer)
export interface ConnectedWallet {
  address: string;
  type: 'eoa' | 'aa';
  provider: 'metamask' | 'walletconnect' | 'dynamic' | 'coinbase' | 'unknown';
}

// Arena wallet (smart contract per competition)
export interface ArenaWallet {
  address: string;
  competitionId: string;
  competitionNumber: number;
  balance: number;
  equity: number;
  roi: number;
  rank: number;
  initialDeposit: number;
  depositsLocked: boolean;
  isForfeited: boolean;
  status: 'ACTIVE' | 'QUALIFIED' | 'ELIMINATED' | 'WITHDRAWN';
}

// Protocol wallet system
export interface PredifiWalletSystem {
  connectedWallet: ConnectedWallet | null;
  proxyAddress: string | null;
  ledgerBalance: number;
  arenaWallets: ArenaWallet[];
}

// Supported networks for deposits
export interface SupportedNetwork {
  name: string;
  chainId: number;
  usdcAddress: string;
  isArenaCompatible: boolean;
  icon?: string;
}

// Deposit flow types
export type DepositSource = 'internal' | 'external';
export type DepositTarget = 'ledger' | 'arena';

export interface DepositConfig {
  source: DepositSource;
  target: DepositTarget;
  targetAddress: string;
  amount: number;
  network?: SupportedNetwork;
}

// Wallet context state
export interface PredifiWalletContextState {
  // Authentication
  connectedWallet: ConnectedWallet | null;
  isConnected: boolean;
  
  // Protocol addresses
  proxyAddress: string | null;
  
  // Balances
  ledgerBalance: number;
  ledgerBalanceLoading: boolean;
  
  // Arena wallets
  arenaWallets: ArenaWallet[];
  arenaWalletsLoading: boolean;
  currentArenaWallet: ArenaWallet | null;
  
  // Actions
  setCurrentArenaWallet: (wallet: ArenaWallet | null) => void;
  refreshLedgerBalance: () => Promise<void>;
  refreshArenaWallets: () => Promise<void>;
  
  // Network
  supportedNetworks: SupportedNetwork[];
}

// GMX specific types
export interface GmxMarket {
  address: string;
  symbol: string;
  indexToken: string;
  longToken: string;
  shortToken: string;
  price: number;
  priceChange24h: number;
  fundingRate: number;
  openInterest: {
    long: number;
    short: number;
  };
  liquidity: number;
}

export interface GmxPosition {
  id: string;
  market: string;
  marketSymbol: string;
  side: 'long' | 'short';
  size: number;
  collateral: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  liquidationPrice: number;
  createdAt: string;
}

export interface GmxOrder {
  id: string;
  market: string;
  marketSymbol: string;
  side: 'long' | 'short';
  orderType: 'market' | 'limit';
  size: number;
  price?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'failed';
  createdAt: string;
  filledAt?: string;
}

export interface OrderParams {
  marketAddress: string;
  side: 'long' | 'short';
  collateralAmount: bigint;
  leverage: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
  slippageBps?: number;
}
