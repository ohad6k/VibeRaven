import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type ListToolsRequest,
  type CallToolRequest
} from '@modelcontextprotocol/sdk/types.js';
import { ALL_TOOLS, handleRequest } from './tools/index.js';

const SERVER_INFO = { name: 'viberaven-mcp', version: '1.2.4' };

const server = new Server(SERVER_INFO, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async (request: ListToolsRequest) =>
  handleRequest('tools/list', request.params)
);

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) =>
  handleRequest('tools/call', request.params)
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { SERVER_INFO, ALL_TOOLS };
