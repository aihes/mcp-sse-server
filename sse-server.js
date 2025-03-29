import express from "express";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import cors from "cors";

// Create an MCP server
const server = new McpServer({
  name: "SSE-Demo",
  version: "1.0.0"
});

// Add an addition tool
server.tool(
  "add",
  "Adds two numbers together",
  {
    a: z.number().describe("First number to add"),
    b: z.number().describe("Second number to add")
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

// Add a multiplication tool
server.tool(
  "multiply",
  "Multiplies two numbers together",
  {
    a: z.number().describe("First number to multiply"),
    b: z.number().describe("Second number to multiply")
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a * b) }]
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
        },
        { 
          uri: "greeting://Alice", 
          name: "Alice Greeting",
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
      text: `Hello, ${name}!`
    }]
  })
);

// Create Express app
const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies with increased size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports = {};

// SSE endpoint
app.get("/sse", async (_, res) => {
  console.log("New SSE connection established");
  debugger
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  
  res.on("close", () => {
    console.log(`Connection closed for session: ${transport.sessionId}`);
    delete transports[transport.sessionId];
  });
  
  await server.connect(transport);
});

// Message handling endpoint
app.post("/messages", express.json({limit: '10mb'}), async (req, res) => {
  const sessionId = req.query.sessionId;
  console.log(`[DEBUG] Received message for session: ${sessionId}`);
  console.log(`[DEBUG] Request headers:`, req.headers);
  console.log(`[DEBUG] Request query:`, req.query);
  
  try {
    // req.body is already parsed by express.json() middleware
    const parsedBody = req.body;
    console.log('[DEBUG] Parsed message body:', JSON.stringify(parsedBody, null, 2));
    
    const transport = transports[sessionId];
    console.log(`[DEBUG] Found transport:`, !!transport);
    
    if (transport) {
      console.log(`[DEBUG] Calling handlePostMessage...`);
      try {
        // Pass the parsed body to handlePostMessage
        await transport.handlePostMessage(req, res, parsedBody);
        console.log(`[DEBUG] handlePostMessage completed successfully`);
      } catch (transportError) {
        console.error(`[DEBUG] Error in handlePostMessage:`, transportError);
        console.error(`[DEBUG] Error stack:`, transportError.stack);
        res.status(500).send(`Error in transport.handlePostMessage: ${transportError.message}`);
      }
    } else {
      console.error(`[DEBUG] No transport found for sessionId: ${sessionId}`);
      res.status(400).send('No transport found for sessionId');
    }
  } catch (error) {
    console.error('[DEBUG] Error processing message:', error);
    console.error('[DEBUG] Error stack:', error.stack);
    res.status(400).send(`Error processing message: ${error.message}`);
  }
});

// Serve static files (optional, uncomment if needed)
// app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  console.log(`SSE MCP Server running on http://localhost:${PORT}`);
  console.log(`Connect to SSE endpoint at http://localhost:${PORT}/sse`);
});
