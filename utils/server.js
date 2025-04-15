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

// // Add a simple prompt without arguments
// server.prompt("hello", async () => ({
//   content: [{ type: "text", text: "Hello! How can I help you today?" }]
// }));

// // Add a prompt with description
// server.prompt("welcome", 
//   "A friendly welcome message", 
//   async () => ({
//     content: [{ type: "text", text: "Welcome to the MCP Demo server!" }]
//   })
// );

// // Add a prompt with arguments
// server.prompt("greet",
//   { name: z.string() },
//   async ({ name }) => ({
//     content: [{ type: "text", text: `Hello, ${name}! Nice to meet you.` }]
//   })
// );

// Add a prompt with description and arguments
server.prompt("introduce",
  "Introduces the AI assistant with custom details",
  { 
    name: z.string().describe("Your name"),
    role: z.string().optional().describe("Your role or profession")
  },
  async ({ name, role }) => {
    const roleText = role ? ` As a ${role}, I` : " I";
    return {
      messages: [],  // Required by the protocol
      content: [{ 
        type: "text", 
        text: `Nice to meet you, ${name}!${roleText} am here to assist you with any questions or tasks you might have.` 
      }]
    };
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);