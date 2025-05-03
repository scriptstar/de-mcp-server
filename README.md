# Data Engineering Tutor MCP Server

This repo contains a simple Model Context Protocol (MCP) server built with Node.js and TypeScript. It acts as a "Data Engineering Tutor," providing personalized updates about Data Engineering concepts, patterns, and technologies to a connected AI client.

This server demonstrates key MCP concepts: defining **Resources**, **Tools**, and **Prompts** to create a stateful, interactive agent helper.

## Prerequisites

- Node.js (v18 or later recommended)
- `npm` (or your preferred Node.js package manager like `yarn` or `pnpm`)
- An AI client capable of connecting to an MCP server (e.g., Cursor, Claude desktop app)
- An [OpenRouter API Key](https://openrouter.ai/) (for fetching live Data Engineering updates via Perplexity)

## Setup

1.  **Clone the Repository:**

    ```bash
    # If you haven't already
    # git clone <repository-url>
    # cd <repository-directory>
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

3.  **Prepare API Key:** The `de_tutor_get_updates` tool requires an OpenRouter API key.

    - Obtain your key from [OpenRouter](https://openrouter.ai/).
    - Create a `.env` file in the project root (you can copy `.env.example`).
    - Add your key to the `.env` file:
      ```
      OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxxxxxxx
      ```
      _(Replace the placeholder with your actual key.)_

4.  **Build the Server:** Compile the TypeScript code.

    ```bash
    npm run build
    ```

## Running the Server

You can run the server directly using Node:

```bash
node build/index.js
```

Alternatively, configure your MCP client (like Cursor or the Claude desktop app) to launch the server. The server name is `de-tutor` and the binary name (if needed for client config) is also `de-tutor`.

**Example Client Configuration (e.g., for Claude Desktop):**

```json
{
  "mcpServers": {
    "de-tutor": {
      "command": "node",
      "args": ["/full/path/to/your/project/build/index.js"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-xxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

_(Ensure the path in `args` is the correct **absolute path** to the built `index.js` file on your system. You might not need the `env` section here if you are already using the `.env` file, as the server loads it directly via `dotenv`.)_

## Using with Cursor

[Cursor](https://cursor.sh/) is an AI-first code editor that can act as an MCP client. Setting up this server with Cursor requires configuring the server launch and potentially setting up a Project Rule for the guidance prompt, although Cursor might also pick up the server-provided prompt.

1.  **Configure Server in Cursor:**

    - Go to `Cursor Settings` > `MCP` > `Add new global MCP server`.
    - Paste in the same JSON as the example client configuration above, ensuring the path to `build/index.js` is correct for your system.

2.  **(Optional) Create a Cursor Project Rule for the Prompt:** If you prefer explicit rules or find Cursor isn't using the server's prompt automatically, you can provide the guidance using Cursor's [Project Rules](https://docs.cursor.com/context/rules-for-ai) feature.

    - Create the directory `.cursor/rules` in your project root if it doesn't exist.
    - Create a file inside it named `de-tutor.rule` (or any `.rule` filename).
    - Paste the following guidance text into `de-tutor.rule`:

      ```text
      You are a helpful assistant connecting to a Data Engineering knowledge server. Your goal is to provide the user with personalized updates about new Data Engineering concepts, patterns, and technologies they haven't encountered yet.

      Available Tools:
      1.  `de_tutor_get_updates`: Fetches recent general news and articles about Data Engineering. Use this first to see what's new.
      2.  `de_tutor_read_memory`: Checks which Data Engineering concepts the user already knows based on their stored knowledge profile.
      3.  `de_tutor_write_memory`: Updates the user's profile to mark whether they have learned or already know a specific Data Engineering concept mentioned in an update.

      Your Workflow:
      1.  Call `de_tutor_get_updates` to discover recent Data Engineering developments.
      2.  Call `de_tutor_read_memory` to understand the user's current knowledge base.
      3.  Present the new developments to the user, highlighting things they likely don't know.
      4.  If the user confirms they know a concept or have learned it, call `de_tutor_write_memory` to update their profile.

      Be concise and focus on delivering relevant, new information tailored to the user's existing knowledge.
      ```

3.  **Connect and Use:**
    - Ensure the `de-tutor` server is enabled in Cursor's MCP settings.
    - If using a rule file: Start a new chat or code generation request (e.g., Cmd+K) and include `@de-tutor-rule` (or whatever you named your rule file) in your request. This tells Cursor to load the rule's content, providing instructions on how to use the tools.
    - If relying on the server prompt: Simply start interacting with Cursor; it should have access to the tools and the guidance prompt provided by the server.

## Features & Usage

This server provides the following capabilities:

- **Resource (`data_engineering_knowledge_memory`):** Stores a simple JSON object in `data/data-engineering-knowledge.json` mapping known concepts (strings) to boolean flags (`true`).
- **Tools:**
  - `de_tutor_read_memory`: Reads the current known concepts from the JSON file.
  - `de_tutor_write_memory`: Updates the JSON file to mark a concept as known (`true`) or unknown (`false`). Takes `concept` (string) and `known` (boolean) as input.
  - `de_tutor_get_updates`: Uses your OpenRouter API key to query Perplexity (`perplexity/sonar-small-online`) for recent Data Engineering news, patterns, and technologies.
- **Prompt (`data-engineering-tutor-guidance`):** Provides instructions to the connected AI client on how to use the tools in a workflow:
  1. Get latest updates.
  2. Read known concepts from memory.
  3. Present new information to the user.
  4. Update memory based on user feedback.

## Development & Debugging

- **Build:** `npm run build` compiles TypeScript to JavaScript in the `build/` directory.
- **Code Structure:** See `src/` for implementation details:
  - `src/index.ts`: Server entry point. Imports `McpServer` and `StdioServerTransport` from specific SDK paths. Instantiates `McpServer`. Imports and calls registration functions (`registerPrompts`, `registerResources`, `registerTools`) from other modules, passing the server instance. Sets up and connects the server using `StdioServerTransport`.
  - `src/prompts/index.ts`: Defines the guidance prompt text. Exports `registerPrompts`, which takes the `McpServer` instance and uses `server.prompt()` to register the static guidance prompt with its callback.
  - `src/resources/index.ts`: Exports `KnowledgeMemory` type and helper functions (`readMemoryFile`, `writeMemoryFile`) for file I/O on `data/data-engineering-knowledge.json`. Exports `registerResources`, which takes the `McpServer` instance and uses `server.resource()` to register the `data_engineering_knowledge_memory` resource with a specific URI and a `ReadResourceCallback`.
  - `src/tools/index.ts`: Exports `registerTools`, which takes the `McpServer` instance and uses `server.tool()` to register each tool (`de_tutor_read_memory`, `de_tutor_write_memory`, `de_tutor_get_updates`). Defines input schemas using Zod where necessary (for `write_memory`). Tool functions use helpers from `resources/index.ts` or `fetch` to perform actions and return results in the expected format.
- **MCP Inspector:** Use `@modelcontextprotocol/inspector` to see raw message flow:
  ```bash
  npx @modelcontextprotocol/inspector node ./build/index.js
  ```
  _(Ensure `OPENROUTER_API_KEY` is set in your environment if running this way and not relying solely on the `.env` file loaded by the server itself.)_

## Notes

- This server uses a simple file (`data/data-engineering-knowledge.json`) for storing user knowledge. For more robust applications, consider a proper database.
- Error handling is basic; production servers would need more comprehensive error management.

## Wrapping up

This demo demonstrates the core steps involved in creating a functional MCP server using the TypeScript SDK and the `McpServer` class. We defined a resource to manage state, tools to perform actions (including interacting with an external API), and a prompt to guide the AI client.

This provides a foundation for building more complex and useful agentic capabilities with MCP.

(Also, if you run into any 🐛bugs, feel free to open up an issue.)
