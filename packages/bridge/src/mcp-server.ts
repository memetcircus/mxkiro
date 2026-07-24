/**
 * MCP Server — Allows Kiro agent to directly control MX Creative Console.
 * 
 * Tools provided:
 * - mx_send_notification: Show a message on LCD
 * - mx_update_buttons: Change button labels/icons
 * - mx_show_animation: Trigger animations
 * - mx_set_status: Set overall console state
 * 
 * Runs as a stdio MCP server that Kiro connects to.
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';

interface McpTool {
  name: string;
  description: string;
  inputSchema: object;
}

interface McpRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

type BridgeNotifier = (msg: any) => void;

const TOOLS: McpTool[] = [
  {
    name: 'mx_send_notification',
    description: 'Show a short notification message on the MX Creative Console LCD buttons. Use for brief status updates, confirmations, or alerts.',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Short message to display (max 30 chars)' },
        icon: { type: 'string', description: 'Emoji or icon name to show alongside message' },
        duration: { type: 'number', description: 'Display duration in milliseconds (default: 3000)' },
        style: { type: 'string', enum: ['info', 'success', 'warning', 'error'], description: 'Visual style' },
      },
      required: ['message'],
    },
  },
  {
    name: 'mx_update_buttons',
    description: 'Update the labels and icons shown on MX Creative Console LCD buttons. Each button has an index (0-8) in the 3x3 grid.',
    inputSchema: {
      type: 'object',
      properties: {
        buttons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'number', description: 'Button position (0-8, left-to-right, top-to-bottom)' },
              label: { type: 'string', description: 'Button label text' },
              icon: { type: 'string', description: 'Button icon (emoji)' },
            },
            required: ['index', 'label'],
          },
          description: 'Array of button configs to update',
        },
      },
      required: ['buttons'],
    },
  },
  {
    name: 'mx_show_animation',
    description: 'Trigger a full-screen animation on the MX Creative Console LCD grid. The animation plays across all 9 buttons as a single canvas.',
    inputSchema: {
      type: 'object',
      properties: {
        animation: {
          type: 'string',
          enum: ['ghost_walk', 'fire', 'celebration', 'thinking', 'error'],
          description: 'Animation to play',
        },
        duration: { type: 'number', description: 'Duration in ms (0 = loop until stopped)' },
      },
      required: ['animation'],
    },
  },
  {
    name: 'mx_set_status',
    description: 'Set the overall status mode of the MX Creative Console. Controls what is displayed and which animations are active.',
    inputSchema: {
      type: 'object',
      properties: {
        state: {
          type: 'string',
          enum: ['idle', 'working', 'waiting', 'error', 'success'],
          description: 'Console state',
        },
        message: { type: 'string', description: 'Optional status message' },
      },
      required: ['state'],
    },
  },
];

export class McpServer {
  private bridgeNotifier: BridgeNotifier | null = null;
  private buffer = '';

  constructor(notifier: BridgeNotifier) {
    this.bridgeNotifier = notifier;
  }

  /**
   * Start listening on stdin for MCP requests (stdio transport).
   */
  startStdio(): void {
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk: string) => {
      this.buffer += chunk;
      this.processBuffer();
    });
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const request = JSON.parse(line) as McpRequest;
        const response = this.handleRequest(request);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch {
        // Skip malformed lines
      }
    }
  }

  private handleRequest(req: McpRequest): object {
    switch (req.method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id: req.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'mx-creative-console', version: '0.1.0' },
          },
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id: req.id,
          result: { tools: TOOLS },
        };

      case 'tools/call':
        return this.handleToolCall(req);

      case 'notifications/initialized':
        // Client acknowledged initialization
        return { jsonrpc: '2.0', id: req.id, result: {} };

      default:
        return {
          jsonrpc: '2.0',
          id: req.id,
          error: { code: -32601, message: `Method not found: ${req.method}` },
        };
    }
  }

  private handleToolCall(req: McpRequest): object {
    const { name, arguments: args } = req.params || {};

    switch (name) {
      case 'mx_send_notification':
        this.bridgeNotifier?.({
          type: 'show_animation',
          animation: 'notification',
          message: args?.message,
          icon: args?.icon,
          style: args?.style || 'info',
          duration: args?.duration || 3000,
        });
        return {
          jsonrpc: '2.0',
          id: req.id,
          result: { content: [{ type: 'text', text: `Notification shown: "${args?.message}"` }] },
        };

      case 'mx_update_buttons':
        this.bridgeNotifier?.({
          type: 'update_buttons',
          buttons: args?.buttons || [],
          page: 0,
        });
        return {
          jsonrpc: '2.0',
          id: req.id,
          result: { content: [{ type: 'text', text: `Updated ${args?.buttons?.length || 0} buttons` }] },
        };

      case 'mx_show_animation':
        this.bridgeNotifier?.({
          type: 'show_animation',
          animation: args?.animation,
          duration: args?.duration || 0,
        });
        return {
          jsonrpc: '2.0',
          id: req.id,
          result: { content: [{ type: 'text', text: `Playing animation: ${args?.animation}` }] },
        };

      case 'mx_set_status':
        this.bridgeNotifier?.({
          type: 'state_change',
          state: args?.state,
          message: args?.message,
        });
        return {
          jsonrpc: '2.0',
          id: req.id,
          result: { content: [{ type: 'text', text: `Status set to: ${args?.state}` }] },
        };

      default:
        return {
          jsonrpc: '2.0',
          id: req.id,
          error: { code: -32602, message: `Unknown tool: ${name}` },
        };
    }
  }
}
