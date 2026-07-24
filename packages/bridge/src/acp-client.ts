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
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }>();

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
    if (!this.sessionId) {
      await this.createSession();
    }
    if (!this.sessionId) return;

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
    // Git and other commands are sent as prompts to Kiro
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
    if (!this.sessionId) return;
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
