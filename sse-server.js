// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import cors from "cors";
import puppeteer from "puppeteer";
import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Configuration for the HTML-to-image feature
const config = {
  imageDomainPrefix: process.env.IMAGE_DOMAIN_PREFIX || `http://localhost:${process.env.PORT || 3001}`,
  imageStoragePath: path.join(process.cwd(), 'public/images')
};

// Ensure the image storage directory exists
fs.ensureDirSync(config.imageStoragePath);

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

// Add a simple prompt without arguments
server.prompt("hello", async () => ({
  messages: [],  // Required by the protocol
  content: [{ type: "text", text: "Hello! How can I help you today?" }]
}));

// Add a prompt with description
server.prompt("welcome", 
  "A friendly welcome message", 
  async () => ({
    messages: [],  // Required by the protocol
    content: [{ type: "text", text: "Welcome to the MCP Demo server!" }]
  })
);

// Add a prompt with arguments
server.prompt("greet",
  { name: z.string() },
  async ({ name }) => ({
    messages: [],  // Required by the protocol
    content: [{ type: "text", text: `Hello, ${name}! Nice to meet you.` }]
  })
);

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

// Add HTML-to-image conversion tool
server.tool(
  "htmlToImage",
  "Converts HTML/SVG content to an image, saves it locally, and returns the image URL",
  {
    htmlContent: z.string().describe("HTML or SVG content to convert to an image"),
    width: z.number().optional().describe("Width of the image in pixels (optional, will auto-adjust if not specified)"),
    height: z.number().optional().describe("Height of the image in pixels (optional, will auto-adjust if not specified)"),
    format: z.enum(["png", "jpeg", "webp"]).optional().default("png").describe("Image format")
  },
  async ({ htmlContent, width, height, format }) => {
    try {
      // Generate a unique filename
      const filename = `${uuidv4()}.${format}`;
      const outputPath = path.join(config.imageStoragePath, filename);
      
      // Launch a headless browser
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      try {
        const page = await browser.newPage();
        
        // Set viewport size if specified, otherwise use a default initial size
        await page.setViewport({ 
          width: width || 1200, 
          height: height || 800 
        });
        
        // Set the HTML content
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // If width or height is not specified, auto-adjust based on content
        if (!width || !height) {
          // Get the dimensions of the content
          const dimensions = await page.evaluate(() => {
            // For SVG content
            const svg = document.querySelector('svg');
            if (svg) {
              const rect = svg.getBoundingClientRect();
              return {
                width: Math.ceil(rect.width),
                height: Math.ceil(rect.height)
              };
            }
            
            // For HTML content, get the body or document dimensions
            return {
              width: Math.max(
                document.body.scrollWidth,
                document.documentElement.scrollWidth,
                document.body.offsetWidth,
                document.documentElement.offsetWidth,
                document.body.clientWidth,
                document.documentElement.clientWidth
              ),
              height: Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.offsetHeight,
                document.body.clientHeight,
                document.documentElement.clientHeight
              )
            };
          });
          
          // Apply the dimensions with some padding
          await page.setViewport({
            width: width || dimensions.width,
            height: height || dimensions.height
          });
        }
        
        // Take a screenshot
        await page.screenshot({
          path: outputPath,
          type: format,
          fullPage: !width || !height // Use fullPage only when auto-adjusting
        });
        
        // Generate the URL for accessing the image
        const imageUrl = `${config.imageDomainPrefix}/images/${filename}`;
        
        return {
          content: [{ 
            type: "text", 
            text: `Image created successfully. You can access it at: ${imageUrl}` 
          }],
          imageUrl // Include the URL in the response for programmatic access
        };
      } finally {
        await browser.close();
      }
    } catch (error) {
      console.error('Error converting HTML to image:', error);
      return {
        content: [{ 
          type: "text", 
          text: `Error converting HTML to image: ${error.message}` 
        }]
      };
    }
  }
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

// Serve static files from the public directory
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  console.log(`SSE MCP Server running on http://localhost:${PORT}`);
  console.log(`Connect to SSE endpoint at http://localhost:${PORT}/sse`);
});
