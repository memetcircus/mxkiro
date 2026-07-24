import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { KiroState } from '@mxkiro/shared';

type StateChangeHandler = (state: KiroState) => void;

export class HttpServer {
  private port: number;
  private stateChangeHandler: StateChangeHandler | null = null;

  constructor(port: number) {
    this.port = port;
  }

  onStateChange(handler: StateChangeHandler): void {
    this.stateChangeHandler = handler;
  }

  async start(): Promise<void> {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url || '/', `http://localhost:${this.port}`);

      // GET /health
      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }

      // GET /state/:state — called by Kiro hooks
      const stateMatch = url.pathname.match(/^\/state\/(.+)$/);
      if (stateMatch && req.method === 'GET') {
        const stateValue = stateMatch[1] as string;
        const state = this.mapState(stateValue);

        if (state) {
          this.stateChangeHandler?.(state);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, state }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Unknown state: ${stateValue}` }));
        }
        return;
      }

      // 404
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    server.listen(this.port);
  }

  private mapState(value: string): KiroState | null {
    const mapping: Record<string, KiroState> = {
      'idle': KiroState.IDLE,
      'working': KiroState.WORKING,
      'waiting': KiroState.WAITING,
      'error': KiroState.ERROR,
      'success': KiroState.SUCCESS,
      'tool-running': KiroState.WORKING,
      'task-complete': KiroState.SUCCESS,
    };
    return mapping[value] ?? null;
  }
}
