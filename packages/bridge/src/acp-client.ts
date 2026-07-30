import { spawn, ChildProcess } from 'node:child_process';
import type { BridgeToPluginMessage } from '@mxkiro/shared';
import { KiroState } from '@mxkiro/shared';

type NotificationHandler = (msg: BridgeToPluginMessage) => void;

/**
 * ACP Client — connects to Kiro CLI via JSON-RPC over stdio.
 * Spawns `kiro-cli acp` and communicates via stdin/stdout.
 */
export class AcpClient {
  private process: ChildProcess | null = null;
  private sessionId: string | null = null;
  private notificationHandler: NotificationHandler | null = null;
  private requestId = 0;
  private buffer = '';
  private _completionCollector: ((type: string, text?: string) => void) | null = null;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }>();

  isConnected(): boolean {
    return this.process !== null && !this.process.killed;
  }

  onNotification(handler: NotificationHandler): void {
    this.notificationHandler = handler;
  }

  async connect(): Promise<void> {
    try {
      this.process = spawn('kiro-cli', ['acp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.process.stdout?.on('data', (data: Buffer) => {
        this.buffer += data.toString();
        this.processBuffer();
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        console.error('🔴 Kiro CLI:', data.toString().trim());
      });

      this.process.on('close', (code) => {
        console.log(`🔴 Kiro CLI exited (code ${code})`);
        this.process = null;
      });

      this.process.on('error', (err) => {
        console.error('🔴 Failed to spawn kiro-cli:', err.message);
        this.process = null;
      });

      // Initialize connection
      const initResult = await this.sendRequest('initialize', {
        protocolVersion: 1,
        clientCapabilities: {
          fs: { readTextFile: true, writeTextFile: true },
          terminal: true,
        },
        clientInfo: { name: 'mxkiro-bridge', version: '0.1.0' },
      });

      console.log('🤖 Kiro ACP initialized:', initResult?.agentInfo?.name ?? 'unknown');
    } catch (err) {
      console.warn('⚠️ Kiro CLI not available — running in offline mode');
      console.warn('   Install Kiro CLI: curl -fsSL https://cli.kiro.dev/install | bash');
    }
  }

  async createSession(cwd?: string): Promise<string | null> {
    const result = await this.sendRequest('session/new', {
      cwd: cwd || process.cwd(),
      mcpServers: [],
    });

    if (result?.sessionId) {
      this.sessionId = result.sessionId;
      return this.sessionId;
    }
    return null;
  }

  async loadSession(sessionId: string): Promise<void> {
    const result = await this.sendRequest('session/load', { sessionId });
    if (result) {
      this.sessionId = sessionId;
    }
  }

  async sendSkillPrompt(skillOrPrompt: string): Promise<void> {
    // Auto-reconnect if process died
    if (!this.isConnected()) {
      console.log('🔄 ACP reconnecting...');
      await this.connect();
      if (!this.isConnected()) {
        console.warn(`⚠️ ACP offline — cannot send: "${skillOrPrompt.substring(0, 40)}"`);
        return;
      }
    }

    // Each prompt gets a fresh session (kiro-cli acp is single-shot)
    this.sessionId = null;
    await this.createSession();
    if (!this.sessionId) {
      console.warn('⚠️ Failed to create session');
      return;
    }

    await this.sendRequest('session/prompt', {
      sessionId: this.sessionId,
      content: [{ type: 'text', text: skillOrPrompt }],
    });

    this.notificationHandler?.({
      type: 'state_change',
      state: KiroState.WORKING,
    });
  }

  async sendCommand(command: string): Promise<void> {
    const promptMap: Record<string, string> = {
      'git-commit': 'Generate a commit message for the current changes and commit them.',
      'git-push': 'Run git push to push current branch to origin.',
      'git-pull': 'Run git pull to update from remote.',
      'create-pr': 'Create a pull request for the current branch with a descriptive title and summary.',
    };

    const prompt = promptMap[command] ?? command;
    await this.sendSkillPrompt(prompt);
  }

  async setModel(modelId: string): Promise<void> {
    if (!this.sessionId) return;
    await this.sendRequest('session/set_model', {
      sessionId: this.sessionId,
      model: modelId,
    });
  }

  async cancelSession(): Promise<void> {
    if (!this.sessionId || !this.isConnected()) return;
    await this.sendRequest('session/cancel', { sessionId: this.sessionId });
    this.notificationHandler?.({
      type: 'state_change',
      state: KiroState.IDLE,
    });
  }

  async sendResponse(value: string): Promise<void> {
    // TODO: Map response to ACP tool approval mechanism
    console.log(`✅ Sending response to Kiro: ${value}`);
  }

  /**
   * Send a prompt and collect the full response text.
   * Used for struct/rewrite operations where we need the response back.
   */
  async getCompletion(prompt: string): Promise<string> {
    if (!this.isConnected()) {
      await this.connect();
      if (!this.isConnected()) {
        throw new Error('ACP offline');
      }
    }

    // Fresh session
    const prevSession = this.sessionId;
    this.sessionId = null;
    await this.createSession();
    if (!this.sessionId) {
      this.sessionId = prevSession;
      throw new Error('Failed to create session');
    }

    // Set up chunk collection
    let responseText = '';
    let done = false;
    this._completionCollector = (type: string, text?: string) => {
      if (type === 'AgentMessageChunk' && text) {
        responseText += text;
      } else if (type === 'TurnEnd') {
        done = true;
      }
    };

    // Send prompt
    await this.sendRequest('session/prompt', {
      sessionId: this.sessionId,
      content: [{ type: 'text', text: prompt }],
    });

    // Wait for TurnEnd (max 30s)
    const startTime = Date.now();
    while (!done && Date.now() - startTime < 30000) {
      await new Promise((r) => setTimeout(r, 100));
    }

    // Cleanup
    this._completionCollector = null;
    this.sessionId = prevSession;

    if (!responseText.trim()) {
      throw new Error('No response received');
    }

    return responseText.trim();
  }

  async toggleAutopilot(): Promise<void> {
    // TODO: Implement via ACP extension or keyboard simulation
    console.log('🤖 Autopilot toggle requested');
  }

  // --- Private ---

  private sendRequest(method: string, params: unknown): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.process?.stdin) {
        resolve(null);
        return;
      }

      const id = ++this.requestId;
      const message = JSON.stringify({ jsonrpc: '2.0', id, method, params });

      this.pendingRequests.set(id, { resolve, reject });
      this.process.stdin.write(message + '\n');

      // Timeout after 10s
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          resolve(null);
        }
      }, 10000);
    });
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        this.handleMessage(msg);
      } catch {
        // Skip non-JSON lines
      }
    }
  }

  private handleMessage(msg: any): void {
    // Response to our request
    if (msg.id && this.pendingRequests.has(msg.id)) {
      const pending = this.pendingRequests.get(msg.id)!;
      this.pendingRequests.delete(msg.id);
      if (msg.error) {
        pending.reject(msg.error);
      } else {
        pending.resolve(msg.result);
      }
      return;
    }

    // Notification from Kiro
    if (msg.method === 'session/notification') {
      this.handleNotification(msg.params);
    }
  }

  private handleNotification(params: any): void {
    if (!params) return;

    // Feed completion collector if active
    if (this._completionCollector) {
      this._completionCollector(params.type, params.text);
      return; // Don't broadcast during completion collection
    }

    switch (params.type) {
      case 'TurnEnd':
        this.notificationHandler?.({
          type: 'state_change',
          state: KiroState.IDLE,
        });
        break;

      case 'ToolCall':
        if (params.status === 'pending') {
          this.notificationHandler?.({
            type: 'state_change',
            state: KiroState.WAITING,
            options: ['Trust', 'Cancel', 'Always Trust'],
          });
        }
        break;

      case 'AgentMessageChunk':
        // Agent is actively generating
        this.notificationHandler?.({
          type: 'state_change',
          state: KiroState.WORKING,
        });
        break;
    }
  }
}
