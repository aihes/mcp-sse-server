/**
 * MCP Client for browser environments
 * Simplified version of the MCP SDK client for use in web applications
 */

class McpClient {
  constructor(options = {}) {
    this.name = options.name || 'Browser MCP Client';
    this.version = options.version || '1.0.0';
    this.transport = null;
    this.connected = false;
    this.sessionId = null;
    this.eventSource = null;
    this.messageQueue = [];
    this.messageHandlers = new Map();
    this.nextMessageId = 1;
  }

  /**
   * Connect to an SSE endpoint
   * @param {string} sseEndpoint - The SSE endpoint URL
   * @returns {Promise<string>} - The session ID
   */
  async connect(sseEndpoint) {
    return new Promise((resolve, reject) => {
      try {
        // Create EventSource for SSE connection
        this.eventSource = new EventSource(sseEndpoint);
        
        // Handle connection open
        this.eventSource.onopen = () => {
          console.log('SSE connection established');
        };
        
        // Handle messages
        this.eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received SSE message:', data);
            
            // Extract session ID from the first message
            if (data.type === 'connection' && data.sessionId) {
              this.sessionId = data.sessionId;
              this.connected = true;
              console.log(`Connected with session ID: ${this.sessionId}`);
              resolve(this.sessionId);
            }
            
            // Handle response messages
            if (data.type === 'response' && data.id) {
              const handler = this.messageHandlers.get(data.id);
              if (handler) {
                handler.resolve(data);
                this.messageHandlers.delete(data.id);
              }
            }
          } catch (error) {
            console.error('Error processing SSE message:', error);
          }
        };
        
        // Handle errors
        this.eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          if (!this.connected) {
            reject(new Error('Failed to establish SSE connection'));
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Close the connection
   */
  async close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.connected = false;
    this.sessionId = null;
    console.log('Connection closed');
  }

  /**
   * Send a message to the server
   * @param {Object} message - The message to send
   * @returns {Promise<Object>} - The response
   */
  async sendMessage(message) {
    if (!this.connected || !this.sessionId) {
      throw new Error('Not connected to server');
    }
    
    // Add message ID and client info
    const id = this.nextMessageId++;
    const fullMessage = {
      ...message,
      id: id.toString(),
      client: {
        name: this.name,
        version: this.version
      }
    };
    
    // Create a promise for the response
    const responsePromise = new Promise((resolve, reject) => {
      // Set a timeout to reject the promise if no response is received
      const timeoutId = setTimeout(() => {
        this.messageHandlers.delete(id);
        reject(new Error('Request timed out'));
      }, 30000); // 30 second timeout
      
      this.messageHandlers.set(id.toString(), {
        resolve: (data) => {
          clearTimeout(timeoutId);
          resolve(data);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
    });
    
    // Send the message
    try {
      const response = await fetch(`/messages?sessionId=${this.sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullMessage)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // For immediate responses (non-streaming)
      const data = await response.json();
      
      // If this is a direct response (not streaming), resolve the promise
      if (data.id === fullMessage.id) {
        const handler = this.messageHandlers.get(data.id);
        if (handler) {
          handler.resolve(data);
          this.messageHandlers.delete(data.id);
          return data;
        }
      }
    } catch (error) {
      const handler = this.messageHandlers.get(fullMessage.id);
      if (handler) {
        handler.reject(error);
        this.messageHandlers.delete(fullMessage.id);
      }
      throw error;
    }
    
    // Return the promise for streaming responses
    return responsePromise;
  }

  /**
   * List available tools
   * @returns {Promise<Object>} - The tools response
   */
  async listTools() {
    return this.sendMessage({
      type: 'list_tools'
    });
  }

  /**
   * Call a tool
   * @param {Object} options - Tool call options
   * @param {string} options.name - The name of the tool
   * @param {Object} options.arguments - The arguments for the tool
   * @returns {Promise<Object>} - The tool response
   */
  async callTool(options) {
    return this.sendMessage({
      type: 'tool',
      name: options.name,
      arguments: options.arguments
    });
  }

  /**
   * List available resources
   * @returns {Promise<Object>} - The resources response
   */
  async listResources() {
    return this.sendMessage({
      type: 'list_resources'
    });
  }

  /**
   * Read a resource
   * @param {Object} options - Resource options
   * @param {string} options.uri - The URI of the resource
   * @returns {Promise<Object>} - The resource response
   */
  async readResource(options) {
    return this.sendMessage({
      type: 'resource',
      uri: options.uri
    });
  }

  /**
   * List available prompts
   * @returns {Promise<Object>} - The prompts response
   */
  async listPrompts() {
    return this.sendMessage({
      type: 'list_prompts'
    });
  }

  /**
   * Get a prompt
   * @param {Object} options - Prompt options
   * @param {string} options.name - The name of the prompt
   * @param {Object} options.arguments - The arguments for the prompt
   * @returns {Promise<Object>} - The prompt response
   */
  async getPrompt(options) {
    return this.sendMessage({
      type: 'prompt',
      name: options.name,
      arguments: options.arguments || {}
    });
  }
}

// Export the client
window.McpClient = McpClient;
