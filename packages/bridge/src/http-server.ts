import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { KiroState } from '@mxkiro/shared';

type StateChangeHandler = (state: KiroState) => void;
type PromptHandler = (text: string) => void;
type NavigateHandler = (ticks: number) => void;

export class HttpServer {
  private port: number;
  private stateChangeHandler: StateChangeHandler | null = null;
  private promptHandler: PromptHandler | null = null;
  private sessionNavigateHandler: NavigateHandler | null = null;
  private modelSwitchHandler: NavigateHandler | null = null;

  constructor(port: number) {
    this.port = port;
  }

  onStateChange(handler: StateChangeHandler): void {
    this.stateChangeHandler = handler;
  }

  onPrompt(handler: PromptHandler): void {
    this.promptHandler = handler;
  }

  onSessionNavigate(handler: NavigateHandler): void {
    this.sessionNavigateHandler = handler;
  }

  onModelSwitch(handler: NavigateHandler): void {
    this.modelSwitchHandler = handler;
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

      // GET /prompt?text=... — called by C# plugin to send prompt to Kiro
      if (url.pathname === '/prompt' && req.method === 'GET') {
        const text = url.searchParams.get('text') || '';
        console.log(`💬 Prompt received: "${text.substring(0, 50)}..."`);
        this.promptHandler?.(text);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, prompt: text }));
        return;
      }

      // GET /session/navigate?ticks=N — session navigation
      if (url.pathname === '/session/navigate' && req.method === 'GET') {
        const ticks = parseInt(url.searchParams.get('ticks') || '0');
        console.log(`🔄 Session navigate: ${ticks}`);
        this.sessionNavigateHandler?.(ticks);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, ticks }));
        return;
      }

      // GET /model/switch?ticks=N — model switching
      if (url.pathname === '/model/switch' && req.method === 'GET') {
        const ticks = parseInt(url.searchParams.get('ticks') || '0');
        console.log(`🤖 Model switch: ${ticks}`);
        this.modelSwitchHandler?.(ticks);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, ticks }));
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
