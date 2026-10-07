async function main() {
  const token = "5dcd6977-cf91-4c1d-a27f-f619cc2ea03e";
  
  const headersToTry = [
    { Authorization: `Bearer ${token}` },
    { Authorization: `token ${token}` },
    { Authorization: token },
    { "X-Api-Key": token },
    { "x-api-key": token },
    { "api-key": token },
    { Cookie: `token=${token}` }
  ];

  for (const headers of headersToTry) {
    try {
      console.log(`Trying headers: ${JSON.stringify(headers)}`);
      const res = await fetch("https://api.mobbin.com/mcp", { headers });
      console.log(`Response: ${res.status}`);
      if (res.status !== 401) {
        console.log("Success! Headers:", headers);
        process.exit(0);
      }
    } catch (e) {
      console.log("Error:", e.message);
    }
  }
}
main();
