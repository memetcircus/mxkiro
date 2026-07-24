import WebSocket from 'ws';

const BRIDGE_WS_URL = 'ws://localhost:9847';

interface PluginMessage {
  type: string;
  [key: string]: any;
}

export class BridgeClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(BRIDGE_WS_URL);

      this.ws.on('open', () => {
        console.log('🌉 Connected to Bridge');
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleMessage(msg);
        } catch {
          // ignore
        }
      });

      this.ws.on('close', () => {
        console.log('🌉 Bridge disconnected, reconnecting in 3s...');
        this.scheduleReconnect();
      });

      this.ws.on('error', (err) => {
        console.error('❌ Bridge error:', err.message);
        this.scheduleReconnect();
        reject(err);
      });
    });
  }

  send(msg: PluginMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('⚠️ Bridge not connected, dropped:', msg.type);
    }
  }

  private handleMessage(msg: any): void {
    console.log('📨 Bridge →', msg.type, msg);
    // TODO: Update LCD based on state changes
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {});
    }, 3000);
  }
}
