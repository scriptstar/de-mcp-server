import type {
  McpServer,
  ReadResourceCallback,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

// Define and Export the structure for type safety in tools
export type KnowledgeMemory = Record<string, boolean>;

// Determine the directory for storing data files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../../data");
const memoryFilePath = path.join(dataDir, "data-engineering-knowledge.json");

// Helper function to ensure the data directory exists
async function ensureDataDirectory(): Promise<void> {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error: any) {
    if (error.code !== "EEXIST") {
      console.error("Failed to create data directory:", error);
      throw error;
    }
  }
}

// Export helper function to read the memory file for tools
export async function readMemoryFile(): Promise<KnowledgeMemory> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(memoryFilePath, "utf-8");
    return JSON.parse(data) as KnowledgeMemory;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return {};
    }
    console.error("Failed to read memory file:", error);
    throw error;
  }
}

// Export helper function to write to the memory file for tools
export async function writeMemoryFile(data: KnowledgeMemory): Promise<void> {
  try {
    await ensureDataDirectory();
    await fs.writeFile(memoryFilePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write memory file:", error);
    throw error;
  }
}

// Function to register the resource using the McpServer instance
function registerDataEngineeringKnowledgeMemoryResource(server: McpServer) {
  const resourceName = "data_engineering_knowledge_memory";
  const resourceUri = `memory://${resourceName}/user`; // Example static URI

  // Define the callback for reading the resource
  const readCallback: ReadResourceCallback = async (uri) => {
    console.log(`Read request for resource URI: ${uri}`);
    try {
      const memoryData = await readMemoryFile();
      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "application/json",
            text: JSON.stringify(memoryData),
          },
        ],
      };
    } catch (error) {
      console.error(`Error reading resource ${resourceUri}:`, error);
      // How to return errors here needs clarification based on McpServer expectations
      // For now, rethrow which might be handled by the McpServer framework
      throw error;
    }
  };

  // Register the resource with the server
  server.resource(
    resourceName,
    resourceUri, // Using a fixed URI for simplicity
    {
      /* No specific metadata needed for this simple case */
    },
    readCallback
  );

  console.log(`Resource '${resourceName}' registered at URI '${resourceUri}'.`);
  // Note: Write capability is handled by the de_tutor_write_memory tool now,
  // not directly via the resource registration.
}

// Exported function to register all resources
export function registerResources(server: McpServer) {
  registerDataEngineeringKnowledgeMemoryResource(server);
  // Register other resources here if needed
}
