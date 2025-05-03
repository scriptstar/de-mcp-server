import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import dotenv from "dotenv";
import fetch from "node-fetch";
import {
  readMemoryFile,
  writeMemoryFile,
  KnowledgeMemory,
} from "../resources/index.js"; // Need helpers from resources

// Load environment variables from .env file (if it exists)
// Primarily needed for OPENROUTER_API_KEY
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Exported function to register all tools
export function registerTools(server: McpServer) {
  // Tool 1: Read Known Data Engineering Concepts from Memory
  server.tool(
    "de_tutor_read_memory", // Shortened tool name
    "Reads the user's current Data Engineering knowledge from memory.", // Description
    // Input schema (empty object for this tool)
    {},
    // Tool execution function
    async () => {
      try {
        // Use the helper function from resources
        const knownConcepts = await readMemoryFile();
        return {
          // Return result in the format expected by the tool call
          content: [
            {
              type: "text",
              text: JSON.stringify({ knownConcepts: knownConcepts || {} }),
            },
          ],
        };
      } catch (error) {
        console.error("Error reading from memory tool:", error);
        // Return an error message in the tool result format
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Failed to read knowledge memory.",
              }),
            },
          ],
        };
      }
    }
  );

  // Tool 2: Write/Update Known Data Engineering Concepts to Memory
  const writeMemoryInputSchema = {
    concept: z
      .string()
      .describe(
        "The Data Engineering concept name (e.g., 'ETL', 'Data Warehousing')"
      ),
    known: z
      .boolean()
      .describe("Whether the user knows this concept (true/false)"),
  };

  server.tool(
    "de_tutor_write_memory", // Shortened tool name
    "Updates the user's Data Engineering knowledge memory for a specific concept.",
    writeMemoryInputSchema,
    async (args) => {
      const { concept, known } = args; // Args are validated by the server based on schema
      try {
        const currentMemory = await readMemoryFile();
        currentMemory[concept] = known;
        await writeMemoryFile(currentMemory);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                concept: concept,
                known: known,
              }),
            },
          ],
        };
      } catch (error) {
        console.error("Error writing to memory tool:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Failed to write to knowledge memory.",
              }),
            },
          ],
        };
      }
    }
  );

  // Tool 3: Get Latest Data Engineering Updates via OpenRouter/Perplexity
  server.tool(
    "de_tutor_get_updates", // Shortened tool name
    "Fetches recent news and updates about Data Engineering concepts, patterns, and technologies using Perplexity Sonar via OpenRouter.",
    {}, // No specific input query needed for general updates
    async () => {
      if (!OPENROUTER_API_KEY) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "OpenRouter API key is not configured.",
              }),
            },
          ],
        };
      }

      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "perplexity/sonar-small-online",
              messages: [
                {
                  role: "system",
                  content:
                    "You are an AI assistant specialized in finding the latest Data Engineering news, concepts, patterns, and technology updates. Summarize the key recent developments concisely.",
                },
                {
                  role: "user",
                  content:
                    "What are the most important recent updates or newly released patterns/technologies in Data Engineering? Focus on things professionals should be aware of in the last few months.",
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          const errorBody = await response.text();
          console.error("OpenRouter API Error:", response.status, errorBody);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: `Failed to fetch updates from OpenRouter: ${response.status}`,
                }),
              },
            ],
          };
        }

        const data = (await response.json()) as any; // Type assertion for simplicity
        const updates =
          data.choices[0]?.message?.content || "No updates found.";

        // Return the fetched Data Engineering updates as text content
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ updates: updates }),
            },
          ],
        };
      } catch (error) {
        console.error("Error fetching latest updates tool:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "An error occurred while fetching updates.",
              }),
            },
          ],
        };
      }
    }
  );
}
