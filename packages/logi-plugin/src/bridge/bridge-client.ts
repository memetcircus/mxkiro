import WebSocket from 'ws';
import { BRIDGE_WS_URL } from '@mxkiro/shared';
import type { PluginToBridgeMessage, BridgeToPluginMessage } from '@mxkiro/shared';

type MessageHandler = (msg: BridgeToPluginMessage) => void;

/**
 * WebSocket client that connects to the Bridge Service.
 * Sends button/dial events and receives state updates.
 */
export class BridgeClient {
  private ws: WebSocket | null = null;
  private messageHandler: MessageHandler | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  async connect(): Promise<void> {
    return new Promise((resolve) => {
      this.ws = new WebSocket(BRIDGE_WS_URL);

      this.ws.on('open', () => {
        console.log('🌉 Connected to Bridge');
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString()) as BridgeToPluginMessage;
          this.messageHandler?.(msg);
        } catch (err) {
          console.error('❌ Invalid message from bridge:', err);
        }
      });

      this.ws.on('close', () => {
        console.log('🌉 Bridge disconnected, reconnecting in 3s...');
        this.scheduleReconnect();
      });

      this.ws.on('error', (err) => {
        console.error('❌ Bridge connection error:', err.message);
        this.scheduleReconnect();
        resolve(); // Don't block startup
      });
    });
  }

  send(msg: PluginToBridgeMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('⚠️ Bridge not connected, message dropped:', msg.type);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }
}
