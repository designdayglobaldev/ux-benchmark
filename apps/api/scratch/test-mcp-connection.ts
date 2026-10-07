import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import EventSource from "eventsource";

// Get token from command line arg
const token = process.argv[2];
if (!token) {
  console.error("Please provide a token");
  process.exit(1);
}

async function test(urlStr) {
  console.log(`\nTesting URL: ${urlStr}`);
  const transport = new SSEClientTransport(new URL(urlStr), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });

  transport.onmessage = (message) => console.log("Received message:", message);
  transport.onerror = (error) => console.log("Transport error:", error);

  try {
    console.log("Connecting...");
    await client.connect(transport);
    console.log("Connected successfully!");
    
    console.log("Calling tool...");
    const result = await client.callTool({
      name: "search_flows",
      arguments: { query: "Spotify", platform: "web", limit: 1 }
    });
    console.log("Tool result:", JSON.stringify(result, null, 2));
    
    await transport.close();
  } catch (err) {
    console.error("Caught error:", err);
  }
}

async function main() {
  await test("https://api.mobbin.com/mcp");
  await test("https://api.mobbin.com/mcp/sse");
}

main().catch(console.error);
