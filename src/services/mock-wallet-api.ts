import type { WalletBalance, WalletTransaction, DepositAddress, WalletAPI } from '@/types/wallet';

const STORAGE_KEYS = {
  BALANCE: 'predifi_mock_balance',
  TRANSACTIONS: 'predifi_mock_transactions',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const generateMockTxHash = () => '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

const initializeBalance = (): WalletBalance => {
  const stored = localStorage.getItem(STORAGE_KEYS.BALANCE);
  if (stored) {
    const parsed = JSON.parse(stored);
    return { ...parsed, lastUpdated: new Date(parsed.lastUpdated) };
  }
  const initial: WalletBalance = { available: 1000, locked: 0, pending: 0, total: 1000, lastUpdated: new Date() };
  localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(initial));
  return initial;
};

const initializeTransactions = (): WalletTransaction[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (stored) return JSON.parse(stored).map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) }));
  const initial: WalletTransaction[] = [{
    id: 'tx-1',
    type: 'deposit',
    amount: 1000,
    status: 'confirmed',
    txHash: generateMockTxHash(),
    timestamp: new Date(Date.now() - 86400000),
    confirmations: 15,
  }];
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initial));
  return initial;
};

const saveBalance = (balance: WalletBalance) => localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(balance));
const saveTransactions = (txs: WalletTransaction[]) => localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));

export const mockWalletAPI: WalletAPI = {
  async getBalance() {
    await sleep(300);
    return initializeBalance();
  },

  async getDepositAddress(): Promise<DepositAddress> {
    return { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', network: 'optimism', chainId: 10 };
  },

  async deposit(amount: number) {
    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'deposit',
      amount,
      status: 'pending',
      txHash: generateMockTxHash(),
      timestamp: new Date(),
      confirmations: 0,
    };

    const transactions = initializeTransactions();
    transactions.unshift(tx);
    saveTransactions(transactions);

    await sleep(2000);

    tx.status = 'confirmed';
    tx.confirmations = 6;
    transactions[0] = tx;
    saveTransactions(transactions);

    const balance = initializeBalance();
    balance.available += amount;
    balance.total += amount;
    balance.lastUpdated = new Date();
    saveBalance(balance);

    return tx;
  },

  async withdraw(amount: number, address: string) {
    const balance = initializeBalance();
    if (amount > balance.available) throw new Error('Insufficient available balance');

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'withdrawal',
      amount,
      status: 'pending',
      destination: address,
      timestamp: new Date(),
    };

    const transactions = initializeTransactions();
    transactions.unshift(tx);
    saveTransactions(transactions);

    balance.available -= amount;
    balance.pending += amount;
    saveBalance(balance);

    await sleep(1000);

    tx.status = 'processing';
    tx.txHash = generateMockTxHash();
    transactions[0] = tx;
    saveTransactions(transactions);

    await sleep(2000);

    tx.status = 'confirmed';
    tx.confirmations = 6;
    transactions[0] = tx;
    saveTransactions(transactions);

    balance.pending -= amount;
    balance.total -= amount;
    saveBalance(balance);

    return tx;
  },

  async getTransactions(limit = 20) {
    await sleep(200);
    return initializeTransactions().slice(0, limit);
  },
};

export const IS_MOCK_MODE = true;
