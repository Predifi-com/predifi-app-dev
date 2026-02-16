import { useState, useCallback, useEffect } from 'react';

// ── Types ──

export interface LivePosition {
  id: string;
  asset: string;
  timeframe: 'hourly' | 'daily';
  market: string; // e.g. "BTC Hourly"
  side: 'YES' | 'NO';
  size: number; // USDC amount (margin)
  shares: number;
  entryPrice: number; // 0-100 cents
  leverage: number;
  openedAt: number; // timestamp
}

export interface FilledOrder {
  id: string;
  asset: string;
  market: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  price: number; // cents
  size: number;
  shares: number;
  filledAt: number;
}

export interface TradeNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info';
  createdAt: number;
  read: boolean;
}

const STORAGE_KEY = 'predifi_live_positions';
const ORDERS_KEY = 'predifi_filled_orders';
const NOTIF_KEY = 'predifi_trade_notifications';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Singleton event emitter for cross-component sync ──
type Listener = () => void;
const listeners = new Set<Listener>();
function notifyListeners() {
  listeners.forEach((l) => l());
}

// ── Public API ──

export function useTradingStore() {
  const [positions, setPositions] = useState<LivePosition[]>(() => loadFromStorage(STORAGE_KEY, []));
  const [orders, setOrders] = useState<FilledOrder[]>(() => loadFromStorage(ORDERS_KEY, []));
  const [notifications, setNotifications] = useState<TradeNotification[]>(() => loadFromStorage(NOTIF_KEY, []));

  // Sync across components
  useEffect(() => {
    const sync = () => {
      setPositions(loadFromStorage(STORAGE_KEY, []));
      setOrders(loadFromStorage(ORDERS_KEY, []));
      setNotifications(loadFromStorage(NOTIF_KEY, []));
    };
    listeners.add(sync);
    return () => { listeners.delete(sync); };
  }, []);

  const openPosition = useCallback((pos: LivePosition) => {
    setPositions((prev) => {
      const next = [pos, ...prev];
      saveToStorage(STORAGE_KEY, next);
      return next;
    });

    // Create filled order entry
    const order: FilledOrder = {
      id: `order-${Date.now()}`,
      asset: pos.asset,
      market: pos.market,
      side: 'BUY',
      type: 'MARKET',
      price: pos.entryPrice,
      size: pos.size,
      shares: pos.shares,
      filledAt: Date.now(),
    };
    setOrders((prev) => {
      const next = [order, ...prev];
      saveToStorage(ORDERS_KEY, next);
      return next;
    });

    // Create notification
    const notif: TradeNotification = {
      id: `notif-${Date.now()}`,
      title: `Order Filled — ${pos.market}`,
      message: `Bought ${pos.shares.toFixed(1)} ${pos.side} shares at ${pos.entryPrice.toFixed(1)}¢ for $${pos.size.toFixed(2)} USDC${pos.leverage > 1 ? ` (${pos.leverage}x leverage)` : ''}`,
      type: 'success',
      createdAt: Date.now(),
      read: false,
    };
    setNotifications((prev) => {
      const next = [notif, ...prev];
      saveToStorage(NOTIF_KEY, next);
      return next;
    });

    notifyListeners();
  }, []);

  const closePosition = useCallback((positionId: string) => {
    setPositions((prev) => {
      const next = prev.filter((p) => p.id !== positionId);
      saveToStorage(STORAGE_KEY, next);
      return next;
    });
    notifyListeners();
  }, []);

  const clearAll = useCallback(() => {
    saveToStorage(STORAGE_KEY, []);
    saveToStorage(ORDERS_KEY, []);
    setPositions([]);
    setOrders([]);
    notifyListeners();
  }, []);

  const markNotifRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => n.id === id ? { ...n, read: true } : n);
      saveToStorage(NOTIF_KEY, next);
      return next;
    });
  }, []);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return {
    positions,
    orders,
    notifications,
    unreadNotifCount,
    openPosition,
    closePosition,
    clearAll,
    markNotifRead,
  };
}
