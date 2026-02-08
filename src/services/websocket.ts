/**
 * Predifi WebSocket Service v2
 * URL: wss://api.predifi.com
 */

const WS_URL = 'wss://api.predifi.com';

export type WebSocketChannel = 'markets' | 'orderbook' | 'trades' | 'positions';

export type WebSocketEventType =
  | 'market_update'
  | 'orderbook_update'
  | 'trade'
  | 'position_update';

export interface WebSocketEvent {
  type: WebSocketEventType;
  market_id?: string;
  [key: string]: any;
}

export interface MarketUpdateEvent {
  type: 'market_update';
  market_id: string;
  yes_price: number;
  no_price: number;
  volume_24h: number;
  last_trade_price: number;
  timestamp: string;
}

export interface OrderbookUpdateEvent {
  type: 'orderbook_update';
  market_id: string;
  bids: { price: number; size: number }[];
  asks: { price: number; size: number }[];
  timestamp: string;
}

export type WebSocketCallback = (event: WebSocketEvent) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private callbacks: Map<string, Set<WebSocketCallback>> = new Map();
  private isConnecting = false;
  private isIntentionalClose = false;

  constructor(private url: string = WS_URL) {}

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return Promise.resolve();
    if (this.isConnecting) return Promise.resolve();

    this.isIntentionalClose = false;
    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected to', this.url);
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketEvent = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnecting = false;
          if (!this.isIntentionalClose) this.attemptReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isIntentionalClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    setTimeout(() => {
      this.connect().catch((e) => console.error('Reconnection failed:', e));
    }, delay);
  }

  /** Subscribe to channels for specific markets (v2 format) */
  subscribeToMarkets(channels: WebSocketChannel[], marketIds: string[]): void {
    this.send({ type: 'subscribe', channels, marketIds });
  }

  /** Unsubscribe from channels for specific markets (v2 format) */
  unsubscribeFromMarkets(channels: WebSocketChannel[], marketIds: string[]): void {
    this.send({ type: 'unsubscribe', channels, marketIds });
  }

  /** Generic channel-based subscribe with callback (returns unsubscribe fn) */
  subscribe(channel: string, callback: WebSocketCallback): () => void {
    if (!this.callbacks.has(channel)) {
      this.callbacks.set(channel, new Set());
    }
    this.callbacks.get(channel)!.add(callback);

    return () => {
      const cbs = this.callbacks.get(channel);
      if (cbs) {
        cbs.delete(callback);
        if (cbs.size === 0) this.callbacks.delete(channel);
      }
    };
  }

  private handleMessage(message: WebSocketEvent): void {
    const channels = [
      message.type,
      message.market_id ? `market:${message.market_id}` : null,
      'all',
    ].filter(Boolean) as string[];

    channels.forEach((ch) => {
      this.callbacks.get(ch)?.forEach((cb) => {
        try { cb(message); } catch (e) { console.error(`WS callback error (${ch}):`, e); }
      });
    });
  }

  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected. Message not sent:', data);
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
