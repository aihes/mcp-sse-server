# MCP SSE Server and Client Example

This repository contains a complete example implementation of an SSE (Server-Sent Events) based MCP (Model Context Protocol) server and client.

## Overview

The Model Context Protocol (MCP) is a communication protocol designed for AI systems. This implementation demonstrates how to create an MCP server that uses Server-Sent Events (SSE) for real-time communication with clients.

## Features

- **SSE-based MCP Server**: Implements a server using Express.js and the MCP SDK's SSEServerTransport
- **Interactive MCP Client**: Provides a client implementation that connects to the SSE server
- **Tool Implementations**: Includes example tools (add, multiply) with proper descriptions
- **Dynamic Resources**: Demonstrates dynamic resource templates with URI patterns
- **Debugging Support**: Includes detailed logging and debugging configurations

## Components

- `server.js` - A basic MCP server using StdioServerTransport
- `sse-server.js` - An MCP server using SSEServerTransport with Express.js
- `client.js` - A client for the basic server
- `sse-client.js` - A client for the SSE server

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the SSE server:
   ```bash
   npm run sse-server
   ```

3. In another terminal, run the SSE client:
   ```bash
   npm run sse-client
   ```

## Server Features

The SSE server provides:
- Tool endpoints for addition and multiplication
- A dynamic greeting resource with template support
- Proper session management for multiple clients
- Detailed logging for debugging

## Client Features

The SSE client demonstrates:
- Connecting to the SSE server
- Listing available tools and resources
- Calling tools with parameters
- Reading resources with dynamic parameters

## URI Templates

The server demonstrates how to expose URI templates to clients, allowing them to understand how to construct resource URIs dynamically:

```
greeting://{name} - Replace {name} with any name to get a personalized greeting
```

## License

MIT
