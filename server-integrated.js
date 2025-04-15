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

// Import configuration
import config from "./config.js";

// Configuration for the HTML-to-image feature
const imageConfig = {
  port: config.server.port,
  imageDomainPrefix: config.image.domainPrefix,
  imageStoragePath: path.join(process.cwd(), config.image.storagePath)
};

// Ensure the image storage directory exists
fs.ensureDirSync(imageConfig.imageStoragePath);

// Create an MCP server
const server = new McpServer({
  name: "HTML-to-Image MCP Service",
  version: "1.0.0"
});

// HTML-to-image conversion tool
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
      const outputPath = path.join(imageConfig.imageStoragePath, filename);

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

        // Take a screenshot
        await page.screenshot({
          path: outputPath,
          type: format,
          fullPage: !width || !height // Use fullPage only when auto-adjusting
        });

        // Generate the URL for accessing the image
        const imageUrl = `${imageConfig.imageDomainPrefix}/images/${filename}`;

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

// Add a documentation resource
server.resource(
  "docs",
  new ResourceTemplate("docs://{topic}", {
    // Implement a list callback to make resources discoverable
    list: async () => ({
      resources: [
        {
          uri: "docs://overview",
          name: "HTML-to-Image Service Overview",
          template: "docs://{topic}",
          templateDescription: "Replace {topic} with a documentation topic"
        },
        {
          uri: "docs://api",
          name: "API Documentation",
          template: "docs://{topic}",
          templateDescription: "Replace {topic} with a documentation topic"
        },
        {
          uri: "docs://examples",
          name: "Usage Examples",
          template: "docs://{topic}",
          templateDescription: "Replace {topic} with a documentation topic"
        }
      ]
    })
  }),
  // Add metadata with description
  {
    description: "Documentation resources for the HTML-to-Image service",
    uriTemplateDescription: "Use docs://{topic} to access documentation on specific topics"
  },
  // The read callback provides documentation based on the topic
  async (uri, { topic }) => {
    let content = "";

    switch(topic.toLowerCase()) {
      case "overview":
        content = "The HTML-to-Image service allows you to convert HTML content to images in various formats (PNG, JPEG, WebP). It uses Puppeteer to render the HTML and capture screenshots.";
        break;
      case "api":
        content = "API Endpoints:\n\n1. POST /api/html-to-image - Convert HTML to an image\n   Parameters:\n   - htmlContent (required): The HTML content to convert\n   - width (optional): Image width in pixels\n   - height (optional): Image height in pixels\n   - format (optional): 'png', 'jpeg', or 'webp' (default: 'png')";
        break;
      case "examples":
        content = `Example usage:

fetch('/api/html-to-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    htmlContent: '<div style="background-color: blue; color: white; padding: 20px;">Hello World!</div>',
    width: 800,
    height: 400,
    format: 'png'
  })
})
.then(response => response.json())
.then(data => console.log(data.imageUrl));`;
        break;
      default:
        content = `Documentation topic '${topic}' not found. Available topics: overview, api, examples.`;
    }

    return {
      contents: [{
        uri: uri.href,
        text: content
      }]
    };
  }
);

// Add a welcome prompt
server.prompt("welcome",
  "A friendly welcome message",
  async () => ({
    messages: [],  // Required by the protocol
    content: [{ type: "text", text: "Welcome to the HTML-to-Image Service!" }]
  })
);

// Create Express app
const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies with increased size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports = {};

// Helper function to check if an object has a specific method
function hasMethod(obj, methodName) {
  return obj && typeof obj[methodName] === 'function';
}

// MCP endpoint using SSE transport
app.get("/mcp", async (_, res) => {
  try {
    console.log("New MCP connection established");

    // Create transport with the session ID
    // Let the SSE transport handle the headers
    const transport = new SSEServerTransport(config.mcp.messagesPath, res);
    const sessionId = transport.sessionId;
    console.log(`Created transport with sessionId: ${sessionId}`);

    // Store the transport for later use
    transports[sessionId] = transport;

    // Handle connection close
    res.on("close", () => {
      console.log(`Connection closed for session: ${sessionId}`);
      // Clean up the transport from our lookup
      delete transports[sessionId];
      // Explicitly close the transport to ensure it's properly cleaned up
      if (hasMethod(transport, 'close')) {
        try {
          transport.close();
        } catch (closeError) {
          console.error(`Error closing transport for session ${sessionId}:`, closeError);
        }
      }
    });

    // Connect to the server - this will set up the SSE connection
    await server.connect(transport);

    // Keep the connection alive with a ping every 30 seconds
    // Only set up ping after successful connection
    const pingInterval = setInterval(() => {
      // Check if the response is still writable and the transport is still in our lookup
      if (res.writableEnded || !transports[sessionId]) {
        console.log(`Clearing ping interval for session: ${sessionId} (connection closed)`);
        clearInterval(pingInterval);
        return;
      }

      try {
        // Check if the transport is still connected before sending
        // We can do this by checking if the transport is still in our lookup
        if (transports[sessionId] && hasMethod(transport, 'send')) {
          // Additional check to see if the transport has a valid response
          // This is an internal implementation detail of SSEServerTransport
          // but we can check it safely with optional chaining
          if (transport._sseResponse) {
            transport.send({ type: 'ping' });
          } else {
            console.log(`Transport for session ${sessionId} has no valid response, clearing interval`);
            clearInterval(pingInterval);
            // Clean up the transport from our lookup if it's invalid
            delete transports[sessionId];
          }
        } else {
          // Fallback to direct write if the transport doesn't have a send method
          // but only if the response is still writable
          if (!res.writableEnded) {
            res.write(`:ping\n\n`);
          } else {
            console.log(`Response for session ${sessionId} is no longer writable, clearing interval`);
            clearInterval(pingInterval);
          }
        }
      } catch (pingError) {
        console.error(`Error sending ping for session ${sessionId}:`, pingError);
        clearInterval(pingInterval);
        // Clean up the transport from our lookup if we can't send to it
        delete transports[sessionId];
      }
    }, 30000);

  } catch (error) {
    console.error("Error establishing MCP connection:", error);
    if (!res.headersSent) {
      res.status(500).send("Error establishing MCP connection");
    } else {
      res.end();
    }
  }
});

// Helper function to handle HTML to image conversion
async function handleHtmlToImageRequest(args) {
  const { htmlContent, width, height, format } = args;

  if (!htmlContent) {
    throw new Error("htmlContent is required");
  }

  // Generate a unique filename
  const filename = `${uuidv4()}.${format || config.image.defaultFormat}`;
  const outputPath = path.join(imageConfig.imageStoragePath, filename);

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
      try {
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
          width: width || (dimensions.width + 20), // Add some padding
          height: height || (dimensions.height + 20)
        });

        console.log(`[DEBUG] Auto-adjusted dimensions: ${dimensions.width}x${dimensions.height}`);
      } catch (dimensionError) {
        console.error(`[DEBUG] Error auto-adjusting dimensions:`, dimensionError);
        // Continue with the default dimensions if auto-adjustment fails
      }
    }

    // Take a screenshot
    await page.screenshot({
      path: outputPath,
      type: format || config.image.defaultFormat,
      fullPage: !width || !height // Use fullPage only when auto-adjusting
    });

    // Generate the URL for accessing the image
    const imageUrl = `${imageConfig.imageDomainPrefix}/images/${filename}`;

    return {
      success: true,
      message: "Image created successfully",
      imageUrl: imageUrl
    };
  } catch (error) {
    console.error(`[DEBUG] Error in handleHtmlToImageRequest:`, error);
    throw error; // Re-throw to be handled by the caller
  } finally {
    try {
      await browser.close();
    } catch (closeError) {
      console.error(`[DEBUG] Error closing browser:`, closeError);
    }
  }
}

// Message handling endpoint
app.post(config.mcp.messagesPath, express.json({limit: '10mb'}), async (req, res) => {
  const sessionId = req.query.sessionId;
  console.log(`[DEBUG] Received message for session: ${sessionId}`);
  console.log(`[DEBUG] Request body:`, JSON.stringify(req.body, null, 2));

  try {
    if (!sessionId || !transports[sessionId]) {
      return res.status(400).send("Invalid or missing sessionId");
    }

    // We found the transport but don't need to use it directly
    // Just log that we found it for debugging purposes
    console.log(`[DEBUG] Found transport for session: ${sessionId}`);
  } catch (error) {
    console.error(`[DEBUG] Error in handlePostMessage:`, error);
    return res.status(500).send(`Error in handlePostMessage: ${error.message}`);
  }

    // Handle the message based on its type
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

// Direct API endpoint for HTML-to-image conversion
app.post("/api/html-to-image", async (req, res) => {
  try {
    const result = await handleHtmlToImageRequest(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error converting HTML to image:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API endpoint to get server configuration
app.get('/api/config', (_, res) => {
  // Return a safe subset of the configuration
  const safeConfig = {
    server: {
      host: config.server.host,
      port: config.server.port
    },
    mcp: {
      endpoint: config.mcp.endpoint,
      serviceUrl: config.mcp.serviceUrl
    }
  };

  res.json(safeConfig);
});

// Serve static files from the public directory
app.use(express.static('public'));

// Start the server
app.listen(imageConfig.port, () => {
  console.log(`HTML-to-Image MCP Server running on http://${config.server.host}:${imageConfig.port}`);
  console.log(`Connect to MCP endpoint at http://${config.server.host}:${imageConfig.port}/mcp`);
  console.log(`Visit the homepage at http://${config.server.host}:${imageConfig.port}/`);
  console.log(`Try the demo at http://${config.server.host}:${imageConfig.port}/demo.html`);
});
