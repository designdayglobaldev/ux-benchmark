const data = { query: "spotify", platform: "web", appId: "123", flowId: "456", searchType: "flow" };
fetch("http://localhost:4000/api/v1/mobbin/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
}).then(r => r.json()).then(console.log).catch(console.error);
