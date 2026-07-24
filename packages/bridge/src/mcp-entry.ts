/**
 * MCP Server entry point — runs as a standalone stdio MCP server.
 * Kiro connects to this via mcp.json configuration.
 * 
 * This server forwards tool calls to the Bridge Service via HTTP.
 * 
 * Usage in .kiro/settings/mcp.json:
 * {
 *   "mcpServers": {
 *     "mx-console": {
 *       "command": "node",
 *       "args": ["./node_modules/@mxkiro/bridge/dist/mcp-entry.js"]
 *     }
 *   }
 * }
 */

import { McpServer } from './mcp-server.js';
import { BRIDGE_PORT } from '@mxkiro/shared';

const BRIDGE_HTTP_URL = `http://localhost:${BRIDGE_PORT + 1}`;

// Bridge notifier — sends commands to Bridge via HTTP
async function notifyBridge(msg: any): Promise<void> {
  try {
    const state = msg.state || msg.animation || 'notification';
    await fetch(`${BRIDGE_HTTP_URL}/state/${state}`);
  } catch {
    // Bridge might not be running — that's ok for MCP startup
  }
}

const server = new McpServer(notifyBridge);
server.startStdio();

// Keep process alive
process.stdin.resume();
