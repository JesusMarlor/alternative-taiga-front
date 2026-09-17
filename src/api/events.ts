import { useEffect, useState } from 'react';
import { getSessionId } from './client';
import { getEventsUrl } from '../utils/env';


type EventCallback = (data: any) => void;

class TaigaEventsClient {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, Set<EventCallback>> = new Map();
  private heartbeatTimer: any = null;
  private reconnectTimer: any = null;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private statusListeners: Set<(connected: boolean) => void> = new Set();

  public getConnected(): boolean {
    return this.isConnected;
  }

  public onStatusChange(listener: (connected: boolean) => void) {
    this.statusListeners.add(listener);
    listener(this.isConnected);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatus(connected: boolean) {
    this.isConnected = connected;
    this.statusListeners.forEach((fn) => fn(connected));
  }

  public connect() {
    const token = localStorage.getItem('taiga_token');
    if (!token) return;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;

    try {
      const url = getEventsUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.notifyStatus(true);
        console.log('[Taiga WSS] Conexión en tiempo real establecida');

        // Authenticate with sessionId & token
        const sessionId = getSessionId();
        this.send({
          cmd: 'auth',
          data: { token, sessionId },
        });

        // Resubscribe to active routing keys
        this.subscriptions.forEach((_, routingKey) => {
          this.send({
            cmd: 'subscribe',
            routing_key: routingKey,
          });
        });

        // Start heartbeat
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.routing_key && this.subscriptions.has(payload.routing_key)) {
            const callbacks = this.subscriptions.get(payload.routing_key);
            callbacks?.forEach((cb) => cb(payload.data || payload));
          }
        } catch (err) {
          console.warn('[Taiga WSS] Error parseando mensaje', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[Taiga WSS] Error en WebSocket', err);
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.notifyStatus(false);
        this.stopHeartbeat();
        this.scheduleReconnect();
      };
    } catch (err) {
      this.isConnecting = false;
      this.notifyStatus(false);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (localStorage.getItem('taiga_token')) {
        this.connect();
      }
    }, 5000);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ cmd: 'heartbeat' });
    }, 50000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public subscribe(routingKey: string, callback: EventCallback): () => void {
    if (!this.subscriptions.has(routingKey)) {
      this.subscriptions.set(routingKey, new Set());
      this.send({
        cmd: 'subscribe',
        routing_key: routingKey,
      });
    }

    this.subscriptions.get(routingKey)!.add(callback);

    if (!this.isConnected && !this.isConnecting) {
      this.connect();
    }

    return () => {
      this.unsubscribe(routingKey, callback);
    };
  }

  public unsubscribe(routingKey: string, callback: EventCallback) {
    const callbacks = this.subscriptions.get(routingKey);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(routingKey);
        this.send({
          cmd: 'unsubscribe',
          routing_key: routingKey,
        });
      }
    }
  }

  public disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyStatus(false);
  }
}

export const eventsClient = new TaigaEventsClient();

/**
 * Hook to monitor live WebSocket connection state
 */
export function useLiveConnectionStatus() {
  const [isConnected, setIsConnected] = useState(eventsClient.getConnected());

  useEffect(() => {
    return eventsClient.onStatusChange(setIsConnected);
  }, []);

  return isConnected;
}

/**
 * Hook to subscribe to real-time project changes (userstories, milestones, tasks, issues)
 */
export function useTaigaLiveEvents(
  projectId?: number,
  onUpdate?: (eventData: any) => void
) {
  useEffect(() => {
    if (!projectId || !onUpdate) return;

    const keys = [
      `changes.project.${projectId}.userstories`,
      `changes.project.${projectId}.milestones`,
      `changes.project.${projectId}.tasks`,
      `changes.project.${projectId}.issues`,
    ];

    const unsubs = keys.map((key) =>
      eventsClient.subscribe(key, (data) => {
        console.log(`[Taiga WSS Live] Event received on ${key}:`, data);
        onUpdate(data);
      })
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [projectId, onUpdate]);
}
