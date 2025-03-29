import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";


async function main() {
  // Start the server as a child process
  // const serverProcess = spawn('node', [resolve(__dirname, 'server.js')], {
  //   stdio: ['pipe', 'pipe', process.stderr]
  // });
  const transport = new StdioClientTransport({
    command: "node",
    args: ["server.js"]
  });

  // Create and initialize the client
  const client = new Client({
    name: "Demo Client",
    version: "1.0.0"
  });

  try {
    // Connect to the server
    await client.connect(transport);
    console.log("Connected to server");

    // List available tools
    const tools = await client.listTools();
    console.log("Available tools:", tools);

    // Call the add tool
    const result = await client.callTool({
      name: "add",
      arguments: { a: 5, b: 3 }
    });
    console.log("5 + 3 =", result.content[0].text);

    // List available resources
    const resources = await client.listResources();
    console.log("Available resources:", resources);

    // Get a greeting resource
    const greeting = await client.readResource({
      uri: "greeting://Alice"
    });
    console.log("Greeting:", greeting.contents[0].text);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close the client and server
    await client.close();
  }
}

main().catch(console.error);
