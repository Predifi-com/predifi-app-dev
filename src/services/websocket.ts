import type { Orderbook, Trade } from "@/types/market";
import type { Order } from "@/types/trading";

// Predifi WebSocket URL
const WS_URL = "wss://predifi-ws-service-395321861753.us-east1.run.app/ws";

export type WebSocketEventType =
  | "orderbook_update"
  | "trade"
  | "market_status"
  | "position_update"
  | "order_update";

export interface WebSocketEvent {
  type: WebSocketEventType;
  data: any;
  timestamp: number;
}

export interface OrderbookUpdateEvent {
  type: "orderbook_update";
  data: Orderbook;
}

export interface TradeEvent {
  type: "trade";
  data: Trade;
}

export interface MarketStatusEvent {
  type: "market_status";
  data: {
    marketId: string;
    status: "open" | "paused" | "resolved" | "closed";
  };
}

export interface PositionUpdateEvent {
  type: "position_update";
  data: {
    marketId: string;
    userAddress: string;
    quantity: number;
    unrealizedPnL: number;
  };
}

export interface OrderUpdateEvent {
  type: "order_update";
  data: Order;
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
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return Promise.resolve();
    }

    if (this.isConnecting) {
      console.log("WebSocket connection already in progress");
      return Promise.resolve();
    }

    this.isIntentionalClose = false;
    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketEvent = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("WebSocket disconnected");
          this.isConnecting = false;
          
          if (!this.isIntentionalClose) {
            this.attemptReconnect();
          }
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
      console.error("Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("Reconnection failed:", error);
      });
    }, delay);
  }

  subscribe(channel: string, callback: WebSocketCallback): () => void {
    if (!this.callbacks.has(channel)) {
      this.callbacks.set(channel, new Set());
    }
    
    this.callbacks.get(channel)!.add(callback);

    // Send subscription message to server
    this.send({
      type: "subscribe",
      channel,
    });

    // Return unsubscribe function
    return () => {
      const channelCallbacks = this.callbacks.get(channel);
      if (channelCallbacks) {
        channelCallbacks.delete(callback);
        
        if (channelCallbacks.size === 0) {
          this.callbacks.delete(channel);
          // Send unsubscribe message to server
          this.send({
            type: "unsubscribe",
            channel,
          });
        }
      }
    };
  }

  private handleMessage(message: WebSocketEvent): void {
    // Notify all relevant subscribers
    const channels = [
      message.type, // e.g., "orderbook_update"
      `market:${(message.data as any).marketId}`, // market-specific
      "all", // global listeners
    ];

    channels.forEach((channel) => {
      const callbacks = this.callbacks.get(channel);
      if (callbacks) {
        callbacks.forEach((callback) => {
          try {
            callback(message);
          } catch (error) {
            console.error(`Error in WebSocket callback for channel ${channel}:`, error);
          }
        });
      }
    });
  }

  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not connected. Message not sent:", data);
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsService = new WebSocketService();
