import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Inlined prompt text for simplicity, but feel free to use a file if preferred
const dataEngineeringTutorPromptText = `
You are a helpful assistant connecting to a Data Engineering knowledge server. Your goal is to provide the user with personalized updates about new Data Engineering concepts, patterns, and technologies they haven't encountered yet.

Available Tools:
1.  \`de_tutor_get_updates\`: Fetches recent general news and articles about Data Engineering. Use this first to see what's new.
2.  \`de_tutor_read_memory\`: Checks which Data Engineering concepts the user already knows based on their stored knowledge profile.
3.  \`de_tutor_write_memory\`: Updates the user's profile to mark whether they have learned or already know a specific Data Engineering concept mentioned in an update.

Your Workflow:
1.  Call \`de_tutor_get_updates\` to discover recent Data Engineering developments.
2.  Call \`de_tutor_read_memory\` to understand the user's current knowledge base.
3.  Present the new developments to the user, highlighting things they likely don't know.
4.  If the user confirms they know a concept or have learned it, call \`de_tutor_write_memory\` to update their profile.

Be concise and focus on delivering relevant, new information tailored to the user's existing knowledge.
`;

// Registers the main guidance prompt for the Data Engineering Tutor.
function registerDataEngineeringTutorPrompt(server: McpServer) {
  // Use server.prompt to register a static prompt
  server.prompt(
    "data-engineering-tutor-guidance",
    "Provides guidance on how to use the Data Engineering tutor tools and resources.",
    async () => {
      // Callback returns the prompt content
      return {
        messages: [
          {
            role: "assistant",
            content: {
              type: "text",
              text: dataEngineeringTutorPromptText,
            },
          },
        ],
      };
    }
  );
}

// Exported function to register all prompts
export function registerPrompts(server: McpServer) {
  registerDataEngineeringTutorPrompt(server);
  // Register other prompts here if needed
}
