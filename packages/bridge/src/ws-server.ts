import { WebSocketServer, WebSocket } from 'ws';
import type { PluginToBridgeMessage, BridgeToPluginMessage } from '@mxkiro/shared';

type MessageHandler = (msg: PluginToBridgeMessage) => void;

export class WsServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private messageHandler: MessageHandler | null = null;
  private port: number;

  constructor(port: number) {
    this.port = port;
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  async start(): Promise<void> {
    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on('connection', (ws) => {
      console.log('🔌 Plugin connected');
      this.clients.add(ws);

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString()) as PluginToBridgeMessage;
          this.messageHandler?.(msg);
        } catch (err) {
          console.error('❌ Invalid message from plugin:', err);
        }
      });

      ws.on('close', () => {
        console.log('🔌 Plugin disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (err) => {
        console.error('❌ WebSocket error:', err);
        this.clients.delete(ws);
      });
    });
  }

  broadcast(msg: BridgeToPluginMessage): void {
    const data = JSON.stringify(msg);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}
