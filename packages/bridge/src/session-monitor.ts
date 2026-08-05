import { readdir, stat, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
import { HealthLevel, type SessionInfo, type SessionHealth } from '@mxkiro/shared';
import { HEALTH_WARN_TOKENS, HEALTH_ALERT_TOKENS, HEALTH_CRITICAL_TOKENS } from '@mxkiro/shared';

const SESSIONS_DIR = join(homedir(), '.kiro', 'sessions', 'cli');

export class SessionMonitor {
  private sessions: SessionInfo[] = [];
  private activeSessionId: string | null = null;
  private activeSessionIndex = 0;

  async loadSessions(): Promise<SessionInfo[]> {
    if (!existsSync(SESSIONS_DIR)) {
      this.sessions = [];
      return this.sessions;
    }

    try {
      const files = await readdir(SESSIONS_DIR);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      const sessions: SessionInfo[] = [];

      for (const file of jsonFiles) {
        try {
          const filePath = join(SESSIONS_DIR, file);
          const raw = await readFile(filePath, 'utf-8');
          const data = JSON.parse(raw);
          const id = file.replace('.json', '');

          // Try to get message count from .jsonl file
          let messageCount = 0;
          const jsonlPath = join(SESSIONS_DIR, `${id}.jsonl`);
          if (existsSync(jsonlPath)) {
            const jsonlStat = await stat(jsonlPath);
            // Rough estimate: average line is ~500 bytes
            messageCount = Math.round(jsonlStat.size / 500);
          }

          sessions.push({
            id,
            name: data.name || data.title || `Session ${id.slice(0, 8)}`,
            tokenCount: data.tokenCount || messageCount * 800, // rough estimate
            messageCount,
            createdAt: data.createdAt || '',
            lastActivity: data.lastActivity || data.createdAt || '',
          });
        } catch {
          // Skip invalid session files
        }
      }

      // Sort by last activity (most recent first)
      sessions.sort((a, b) => {
        if (!a.lastActivity || !b.lastActivity) return 0;
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      });

      this.sessions = sessions;
    } catch {
      this.sessions = [];
    }

    return this.sessions;
  }

  getSessions(): SessionInfo[] {
    return this.sessions;
  }

  getSessionCount(): number {
    return this.sessions.length;
  }

  getActiveIndex(): number {
    return this.activeSessionIndex;
  }

  navigateBy(ticks: number): SessionInfo | null {
    if (this.sessions.length === 0) return null;

    this.activeSessionIndex += ticks;

    // Wrap around
    if (this.activeSessionIndex < 0) {
      this.activeSessionIndex = this.sessions.length - 1;
    } else if (this.activeSessionIndex >= this.sessions.length) {
      this.activeSessionIndex = 0;
    }

    const session = this.sessions[this.activeSessionIndex];
    if (session) {
      this.activeSessionId = session.id;
    }
    return session ?? null;
  }

  getActiveSession(): SessionInfo | null {
    if (this.activeSessionId) {
      return this.sessions.find((s) => s.id === this.activeSessionId) ?? null;
    }
    return this.sessions[0] ?? null;
  }

  checkHealth(session?: SessionInfo | null): SessionHealth {
    const s = session ?? this.getActiveSession();
    if (!s) {
      return { tokenCount: 0, messageCount: 0, durationMinutes: 0, level: HealthLevel.NORMAL };
    }

    let level = HealthLevel.NORMAL;
    if (s.tokenCount >= HEALTH_CRITICAL_TOKENS) {
      level = HealthLevel.CRITICAL;
    } else if (s.tokenCount >= HEALTH_ALERT_TOKENS) {
      level = HealthLevel.WORRIED;
    } else if (s.tokenCount >= HEALTH_WARN_TOKENS) {
      level = HealthLevel.WORRIED;
    }

    const durationMinutes = s.createdAt
      ? Math.round((Date.now() - new Date(s.createdAt).getTime()) / 60000)
      : 0;

    return {
      tokenCount: s.tokenCount,
      messageCount: s.messageCount,
      durationMinutes,
      level,
    };
  }
}
