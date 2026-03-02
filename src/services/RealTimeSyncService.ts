import { useEffect, useRef, useState } from 'react';

export interface SyncEvent {
  type: 'update' | 'create' | 'delete';
  entity: 'lease' | 'payment' | 'maintenance' | 'building' | 'unit';
  id: string;
  data: Record<string, any>;
  timestamp: Date;
  source: 'web' | 'mobile';
}

export interface SyncConfig {
  url: string;
  autoReconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export class RealTimeSyncService {
  private ws: WebSocket | null = null;
  private config: SyncConfig;
  private reconnectAttempts = 0;
  private synced: Map<string, any> = new Map();
  private listeners: Map<string, Set<(event: SyncEvent) => void>> = new Map();
  private token: string;

  constructor(config: SyncConfig, token: string) {
    this.config = {
      url: config.url || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/sync`,
      autoReconnect: config.autoReconnect !== false,
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
    };
    this.token = token;
  }

  /**
   * Connect to the real-time sync server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('[RealTimeSync] Connected');
          this.reconnectAttempts = 0;

          // Send authentication
          this.ws!.send(
            JSON.stringify({
              type: 'auth',
              token: this.token,
            })
          );

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[RealTimeSync] Message parse error:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[RealTimeSync] Connection error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[RealTimeSync] Disconnected');
          if (this.config.autoReconnect) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Subscribe to sync events for a specific entity
   */
  subscribe(
    entity: string,
    callback: (event: SyncEvent) => void
  ): () => void {
    if (!this.listeners.has(entity)) {
      this.listeners.set(entity, new Set());
    }
    this.listeners.get(entity)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(entity)?.delete(callback);
    };
  }

  /**
   * Push a local change to server
   */
  async pushSync(event: SyncEvent): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const key = `${event.entity}:${event.id}`;
    this.synced.set(key, event.data);

    this.ws.send(
      JSON.stringify({
        type: 'sync',
        payload: event,
      })
    );
  }

  /**
   * Get synced data for an entity
   */
  getSynced(entity: string, id: string): any {
    return this.synced.get(`${entity}:${id}`);
  }

  /**
   * Get all synced data
   */
  getAllSynced(): Record<string, any> {
    const result: Record<string, any> = {};
    this.synced.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'sync_event':
        this.handleSyncEvent(message.payload);
        break;
      case 'auth_success':
        console.log('[RealTimeSync] Authenticated');
        break;
      case 'error':
        console.error('[RealTimeSync] Server error:', message.message);
        break;
    }
  }

  private handleSyncEvent(event: SyncEvent): void {
    const key = `${event.entity}:${event.id}`;

    // Update local cache
    if (event.type === 'delete') {
      this.synced.delete(key);
    } else {
      this.synced.set(key, event.data);
    }

    // Notify listeners
    const listeners = this.listeners.get(event.entity);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error('[RealTimeSync] Listener error:', error);
        }
      });
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[RealTimeSync] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `[RealTimeSync] Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      this.connect().catch(() => {
        // Error already logged in connect()
      });
    }, delay);
  }
}

/**
 * React Hook for Real-Time Sync
 */
export const useRealTimeSync = (entity: string, id?: string) => {
  const [data, setData] = useState<any>(null);
  const syncServiceRef = useRef<RealTimeSyncService | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!syncServiceRef.current) {
      syncServiceRef.current = new RealTimeSyncService(
        {
          url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/sync`,
          autoReconnect: true,
        },
        token
      );

      syncServiceRef.current.connect().catch(console.error);
    }

    const unsubscribe = syncServiceRef.current.subscribe(entity, (event) => {
      if (!id || event.id === id) {
        setData(event.data);
      }
    });

    return unsubscribe;
  }, [entity, id]);

  return data;
};

export default RealTimeSyncService;
