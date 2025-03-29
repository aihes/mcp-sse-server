import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});

// Add an addition tool
server.tool("add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

// Add a dynamic greeting resource
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { 
    // Implement a list callback to make resources discoverable
    list: async () => ({
      resources: [
        { 
          uri: "greeting://Example", 
          name: "Example Greeting",
          // Add template information to each resource
          template: "greeting://{name}",
          templateDescription: "Replace {name} with any name to get a personalized greeting"
        },
        { 
          uri: "greeting://World", 
          name: "World Greeting",
          template: "greeting://{name}",
          templateDescription: "Replace {name} with any name to get a personalized greeting"
        }
      ]
    })
  }),
  // Add metadata with description
  { 
    description: "A friendly greeting resource",
    uriTemplateDescription: "Use greeting://{name} to get a personalized greeting"
  },
  // The read callback remains the same
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `nihao, ${name}!`
    }]
  })
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);