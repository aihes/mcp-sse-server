/**
 * HTML-to-Image MCP Client Example
 *
 * This example demonstrates how to use the HTML-to-Image service
 * to convert HTML content to images.
 *
 * This example shows two approaches:
 * 1. Using the direct API endpoint
 * 2. Using the MCP protocol (commented out due to compatibility issues)
 */

import fetch from 'node-fetch';
import config from "./config.js";

// Uncomment these imports if you want to use the MCP client
// import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function main() {
  console.log("Initializing HTML-to-Image client example...");

  // Server base URL
  const baseUrl = `http://${config.server.host}:${config.server.port}`;

  try {
    // Example: Using the direct API endpoint
    console.log("\n--- Using Direct API Endpoint ---");

    // HTML content to convert
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: linear-gradient(to right, #ff6b6b, #556270);
            color: white;
            padding: 20px;
            text-align: center;
          }
          h1 {
            font-size: 32px;
            margin-bottom: 10px;
          }
          p {
            font-size: 18px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 30px;
            border-radius: 10px;
            background-color: rgba(255, 255, 255, 0.1);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hello from Direct API!</h1>
          <p>This HTML has been converted to an image using the direct API endpoint.</p>
        </div>
      </body>
      </html>
    `;

    // Call the direct API endpoint
    console.log(`Calling API endpoint at ${baseUrl}/api/html-to-image...`);
    const response = await fetch(`${baseUrl}/api/html-to-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        htmlContent: htmlContent,
        width: 800,
        height: 400,
        format: "png"
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    console.log("Image conversion result:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success && result.imageUrl) {
      console.log(`\nImage URL: ${result.imageUrl}`);
    }

    // Example: Accessing documentation
    console.log("\n--- Documentation Information ---");
    console.log("To access the documentation, you can use the following endpoints:");
    console.log(`- Web UI: ${baseUrl}/`);
    console.log(`- Demo page: ${baseUrl}/demo.html`);
    console.log(`- MCP endpoint: ${baseUrl}/mcp`);
    console.log("\nFor MCP clients, you can access documentation resources using:");
    console.log("- docs://overview - For service overview");
    console.log("- docs://api - For API documentation");
    console.log("- docs://examples - For usage examples");

    console.log("\nExample completed successfully!");

    // The following code demonstrates how to use the MCP protocol
    // This is commented out due to compatibility issues with the current version
    /*
    console.log("\n--- Using MCP Protocol (Example Code) ---");

    // Create an SSE transport that connects to our MCP server
    const serverUrl = new URL(`${baseUrl}/mcp`);
    const transport = new SSEClientTransport(serverUrl);

    // Create and initialize the client
    const client = new Client({
      name: "HTML-to-Image MCP Client Example",
      version: "1.0.0"
    });

    // Connect to the server
    console.log(`Connecting to MCP server at ${serverUrl}...`);
    await client.connect(transport);
    console.log("Connected to server successfully!");

    // List available tools
    console.log("\n--- Available Tools ---");
    const toolsResponse = await client.listTools();

    if (toolsResponse && toolsResponse.tools && Array.isArray(toolsResponse.tools)) {
      toolsResponse.tools.forEach(tool => {
        console.log(`- ${tool.name}: ${tool.description || "No description"}`);
      });
    }

    // Call the htmlToImage tool
    const imageResult = await client.callTool({
      name: "htmlToImage",
      arguments: {
        htmlContent: htmlContent,
        width: 800,
        height: 400,
        format: "png"
      }
    });

    console.log("Image conversion result:");
    console.log(imageResult.content[0].text);

    // List available documentation resources
    console.log("\n--- Documentation Resources ---");
    const resourcesResponse = await client.listResources();

    if (resourcesResponse && resourcesResponse.resources && Array.isArray(resourcesResponse.resources)) {
      resourcesResponse.resources.forEach(resource => {
        console.log(`- ${resource.name}`);
      });

      // Get API documentation
      console.log("\n--- API Documentation ---");
      const apiDocs = await client.readResource({
        uri: "docs://api"
      });
      console.log(apiDocs.contents[0].text);
    }

    // Close the client connection
    await client.close();
    */
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
