import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { KiroState } from '@mxkiro/shared';

type StateChangeHandler = (state: KiroState) => void;
type PromptHandler = (text: string) => void;
type NavigateHandler = (ticks: number) => void;

export class HttpServer {
  private port: number;
  private currentState: string = 'idle';
  private messageCount: number = 0;
  private healthLevel: string = 'normal';
  private stateChangeHandler: StateChangeHandler | null = null;
  private promptHandler: PromptHandler | null = null;
  private sessionNavigateHandler: NavigateHandler | null = null;
  private modelSwitchHandler: NavigateHandler | null = null;
  private sessionResetHandler: (() => void) | null = null;
  private newSessionHandler: (() => void) | null = null;
  private cancelHandler: (() => void) | null = null;
  private snippetHandler: ((text: string) => void) | null = null;
  private screenshotHandler: (() => void) | null = null;

  constructor(port: number) {
    this.port = port;
  }

  onStateChange(handler: StateChangeHandler): void {
    this.stateChangeHandler = handler;
  }

  onSessionReset(handler: () => void): void {
    this.sessionResetHandler = handler;
  }

  onNewSession(handler: () => void): void {
    this.newSessionHandler = handler;
  }

  onCancel(handler: () => void): void {
    this.cancelHandler = handler;
  }

  onSnippet(handler: (text: string) => void): void {
    this.snippetHandler = handler;
  }

  onScreenshot(handler: () => void): void {
    this.screenshotHandler = handler;
  }

  setState(state: string): void {
    this.currentState = state;
    if (state === 'working') {
      this.lastWorkingTime = Date.now();
    }
  }

  private lastWorkingTime: number = 0;

  setHealth(messageCount: number, healthLevel: string): void {
    this.messageCount = messageCount;
    this.healthLevel = healthLevel;
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
        res.end(JSON.stringify({
          status: 'ok',
          state: this.currentState,
          messageCount: this.messageCount,
          healthLevel: this.healthLevel,
          contextUsagePercent: this.messageCount,
        }));
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
          res.end(JSON.stringify({ ok: true, state: this.currentState }));
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

      // GET /session/reset — reset message counter (new session started)
      if (url.pathname === '/session/reset' && req.method === 'GET') {
        this.messageCount = 0;
        this.healthLevel = 'normal';
        this.sessionResetHandler?.();
        console.log('🔄 Session reset — counter cleared');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, messageCount: 0, healthLevel: 'normal' }));
        return;
      }

      // GET /session/new — reset counter + open new session in IDE
      if (url.pathname === '/session/new' && req.method === 'GET') {
        this.messageCount = 0;
        this.healthLevel = 'normal';
        this.sessionResetHandler?.();
        this.newSessionHandler?.();
        console.log('🆕 New session — counter reset + IDE signal');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, messageCount: 0, healthLevel: 'normal' }));
        return;
      }

      // GET /cancel — stop Kiro and set state to idle
      if (url.pathname === '/cancel' && req.method === 'GET') {
        this.currentState = 'idle';
        this.cancelHandler?.();
        console.log('🛑 Cancel — stopping Kiro');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, state: 'idle' }));
        return;
      }

      // GET /screenshot — capture screen area and paste into chat
      if (url.pathname === '/screenshot' && req.method === 'GET') {
        this.screenshotHandler?.();
        console.log('📸 Screenshot requested');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // GET /snippet?text=... — paste text into chat WITHOUT sending Enter
      if (url.pathname === '/snippet' && req.method === 'GET') {
        const text = url.searchParams.get('text') || '';
        console.log(`📝 Snippet append: "${text.substring(0, 40)}"`);
        this.snippetHandler?.(text);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, snippet: text }));
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
