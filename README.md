# HTML to Image MCP Service

This repository contains a complete implementation of an HTML-to-Image conversion service using the Model Context Protocol (MCP) with Server-Sent Events (SSE) as the transport layer.

## Overview

This service allows you to convert HTML or SVG content into high-quality images (PNG, JPEG, or WebP) using Puppeteer for rendering. The service is built on the Model Context Protocol (MCP), which is a communication protocol designed for AI systems, and uses Server-Sent Events (SSE) as the transport layer for real-time communication with clients.

## Features

- **HTML to Image Conversion**: Convert any HTML or SVG content to PNG, JPEG, or WebP images
- **Customizable Dimensions**: Specify width and height for your images or let the service auto-adjust
- **Multilingual Support**: Interface available in English and Chinese
- **Interactive Demo**: Try the service directly from your browser
- **MCP Protocol**: Built on the Model Context Protocol for standardized AI system communication
- **SSE Transport**: Uses Server-Sent Events as the transport layer for real-time communication
- **Debugging Support**: Includes detailed logging and debugging configurations

## Project Structure

### Core Files
- `server-integrated.js` - The main integrated server with HTML-to-Image functionality
- `config.js` - Configuration file for server settings and endpoints
- `index.html` - Main entry point for the application

### Public Directory
- `public/index.html` - The homepage with service information and donation options
- `public/demo.html` - Interactive demo for trying the HTML-to-Image conversion
- `public/locales/` - Language files for multilingual support (en.json, zh.json)
- `public/js/i18n.js` - JavaScript for handling internationalization
- `public/js/mcp-client.js` - Client-side MCP implementation
- `public/images/` - Directory for storing generated images

### Utils Directory
- `utils/mcp-client-example.js` - Example MCP client implementation for HTML-to-Image conversion
- `utils/server.js` - A basic MCP server using StdioServerTransport (for reference)
- `utils/sse-server.js` - The original SSE server implementation (for reference)
- `utils/client.js` - A client for the basic server (for reference)
- `utils/sse-client.js` - SSE client implementation (for reference)
- `utils/test-sse.js` - Test script for SSE functionality
- `utils/simple-test.js` - Simple test server

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the integrated server:
   ```bash
   npm start
   ```

   Or use the development mode with environment variables:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3006/
   ```

4. Try the demo at:
   ```
   http://localhost:3006/demo.html
   ```

5. Run the MCP client example:
   ```bash
   npm run mcp-client
   ```

   This example demonstrates how to use the direct API endpoint to convert HTML to images. It also includes commented code showing how to use the MCP protocol (though this is currently disabled due to compatibility issues).

## HTML-to-Image API

The service provides a tool for converting HTML to images:

```javascript
// Example API call to convert HTML to image
const response = await fetch('/messages?sessionId=your-session-id', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'tool',
    name: 'htmlToImage',
    arguments: {
      htmlContent: '<div style="background: linear-gradient(to right, #ff6b6b, #556270); padding: 20px; color: white; font-family: Arial;"><h1>Hello World!</h1><p>This HTML will be converted to an image</p></div>',
      width: 800,
      height: 400,
      format: 'png'
    }
  })
});

// The response will contain a URL to the generated image
```

### Parameters

- `htmlContent` (string, required): The HTML or SVG content to convert to an image
- `width` (number, optional): Width of the image in pixels
- `height` (number, optional): Height of the image in pixels
- `format` (string, optional): Image format - "png", "jpeg", or "webp" (default: "png")

## Multilingual Support

The service interface is available in:
- English
- Chinese (中文)

Language files are located in the `public/locales/` directory and can be easily extended to support additional languages.

## API Endpoints

The service provides the following API endpoints:

### Direct API

- `POST /api/html-to-image` - Convert HTML to an image
  - Parameters:
    - `htmlContent` (required): The HTML content to convert
    - `width` (optional): Image width in pixels
    - `height` (optional): Image height in pixels
    - `format` (optional): 'png', 'jpeg', or 'webp' (default: 'png')

### MCP Endpoint

- `GET /mcp` - The MCP endpoint for establishing SSE connections
  - This is the endpoint you connect to with an MCP client
  - Example: `const serverUrl = new URL("http://localhost:3006/mcp");`

### MCP Resources

- Documentation resource: `docs://{topic}` - Access documentation on specific topics
  - Available topics: overview, api, examples
- Welcome prompt: `welcome` - Provides a friendly welcome message

## Support the Project

This service is free to use. If you find it valuable for your projects, please consider supporting the development by making a donation via the QR code on the homepage.

## Configuration

The service can be configured using the `config.js` file or environment variables:

### Configuration File

The `config.js` file contains settings for:
- Server host and port
- MCP endpoint paths
- Image service settings

### Environment Variables

- `PORT`: The port on which the server will run (default: 3006)
- `HOST`: The hostname for the server (default: localhost)
- `IMAGE_DOMAIN_PREFIX`: The domain prefix for generated image URLs (default: http://localhost:PORT)

You can create a `.env` file in the root directory to set these variables.

## License

MIT
