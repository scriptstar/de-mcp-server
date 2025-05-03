import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { registerPrompts } from "./prompts/index.js"; // Load registration functions
import { registerResources } from "./resources/index.js";
import { registerTools } from "./tools/index.js";

dotenv.config(); // Load environment variables from .env file

// Instantiate the MCP Server
export const server = new McpServer({
  // Server implementation details (name, version, capabilities)
  // This structure might need adjustment based on McpServer constructor requirements
  name: "de-tutor",
  version: "1.0.0", // Example version
  capabilities: {
    // Assuming capabilities are still needed here
    prompts: {},
    resources: {},
    tools: {},
  },
});

// Register components by passing the server instance
registerPrompts(server);
registerResources(server);
registerTools(server);

// Main function to connect transport and start listening
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log(`🚀 MCP Server connected via stdio`);
}

main().catch((error: Error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
