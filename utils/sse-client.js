import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function main() {
  console.log("Initializing SSE client...");
  
  // Create an SSE transport that connects to our local server
  const serverUrl = new URL("http://localhost:3001/sse");
  const transport = new SSEClientTransport(serverUrl);
  
  // Create and initialize the client
  const client = new Client({
    name: "SSE Demo Client",
    version: "1.0.0"
  });

  try {
    // Connect to the server
    console.log("Connecting to SSE server...");
    await client.connect(transport);
    console.log("Connected to server successfully!");

    // Test 1: List available tools
    console.log("\n--- Testing Tools ---");
    const toolsResponse = await client.listTools();
    console.log("Available tools:");
    console.log("Response:", JSON.stringify(toolsResponse, null, 2));
    
    if (toolsResponse && toolsResponse.tools && Array.isArray(toolsResponse.tools)) {
      toolsResponse.tools.forEach(tool => {
        console.log(`- ${tool.name}: ${tool.description || "No description"}`);
        console.log(`  Schema: ${JSON.stringify(tool.inputSchema, null, 2)}`);
      });
    } else {
      console.log("No tools found or unexpected response format");
    }

    // Test 2: Call the add tool
    console.log("\n--- Testing Add Tool ---");
    const addResult = await client.callTool({
      name: "add",
      arguments: { a: 10, b: 5 }
    });
    console.log(`10 + 5 = ${addResult.content[0].text}`);

    // Test 3: Call the multiply tool
    console.log("\n--- Testing Multiply Tool ---");
    const multiplyResult = await client.callTool({
      name: "multiply",
      arguments: { a: 7, b: 8 }
    });
    console.log(`7 * 8 = ${multiplyResult.content[0].text}`);

    // Test 4: List available resources
    console.log("\n--- Testing Resources ---");
    const resourcesResponse = await client.listResources();
    console.log("Available resources:", JSON.stringify(resourcesResponse, null, 2));
    
    if (resourcesResponse && resourcesResponse.resources && Array.isArray(resourcesResponse.resources)) {
      resourcesResponse.resources.forEach(resource => {
        console.log(`- ${resource.name}: ${resource.description || "No description"}`);
        
        // Display template information if available
        if (resource.template) {
          console.log(`  Template: ${resource.template}`);
          if (resource.templateDescription) {
            console.log(`  Template Usage: ${resource.templateDescription}`);
          }
        } else {
          console.log(`  URI: ${resource.uri}`);
        }
      });
      
      // Display general template information if available on any resource
      const templateInfo = resourcesResponse.resources.find(r => r.uriTemplateDescription);
      if (templateInfo && templateInfo.uriTemplateDescription) {
        console.log("\nGeneral Template Information:");
        console.log(templateInfo.uriTemplateDescription);
      }
    } else {
      console.log("No resources found or unexpected response format");
    }

    // Test 5: Get a greeting resource
    console.log("\n--- Testing Greeting Resource ---");
    const greeting = await client.readResource({
      uri: "greeting://World"
    });
    console.log("Greeting:", greeting.contents[0].text);

    // Test 6: Try another greeting with a different name
    console.log("\n--- Testing Another Greeting ---");
    const anotherGreeting = await client.readResource({
      uri: "greeting://SSE_Client"
    });
    console.log("Another greeting:", anotherGreeting.contents[0].text);

    console.log("\nAll tests completed successfully!");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close the client connection
    console.log("\nClosing client connection...");
    await client.close();
    console.log("Connection closed.");
  }
}

main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
