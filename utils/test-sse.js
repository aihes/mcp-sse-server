import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const app = express();

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports = {};

// Helper function to check if an object has a specific method
function hasMethod(obj, methodName) {
  return obj && typeof obj[methodName] === 'function';
}

// MCP endpoint using SSE transport
app.get("/sse", async (_, res) => {
  try {
    console.log("New SSE connection established");

    // Create transport with the session ID
    // Let the SSE transport handle the headers
    const transport = new SSEServerTransport('/messages', res);
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

    // Keep the connection alive with a ping every 5 seconds
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
            console.log(`Sent ping to session: ${sessionId}`);
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
            console.log(`Sent direct ping to session: ${sessionId}`);
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
    }, 5000); // Shorter interval for testing

  } catch (error) {
    console.error("Error establishing SSE connection:", error);
    if (!res.headersSent) {
      res.status(500).send("Error establishing SSE connection");
    } else {
      res.end();
    }
  }
});

// Start the server
const port = 3004;
app.listen(port, () => {
  console.log(`Test SSE Server running on http://localhost:${port}`);
  console.log(`Connect to SSE endpoint at http://localhost:${port}/sse`);
});
