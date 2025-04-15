/**
 * Configuration file for HTML-to-Image MCP Service
 */

export default {
  // Server configuration
  server: {
    port: process.env.PORT || 3001, // Changed from 3003 to 3006
    host: process.env.HOST || 'localhost'
  },

  // MCP endpoint configuration
  mcp: {
    endpoint: '/mcp', // MCP endpoint path
    messagesPath: '/messages', // Messages endpoint path
    serviceUrl: process.env.MCP_SERVICE_URL || 'https://mcpdev.xyz/mcp' // Complete MCP service URL
  },

  // Image service configuration
  image: {
    domainPrefix: process.env.IMAGE_DOMAIN_PREFIX || `http://localhost:${process.env.PORT || 3001}`,
    storagePath: 'public/images',
    defaultFormat: 'png'
  }
};
