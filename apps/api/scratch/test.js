const fs = require('fs');
const t = JSON.parse(fs.readFileSync('mobbin-tokens.json', 'utf8')).mobbinTokens.accessToken;
fetch('https://api.mobbin.com/mcp/sse', {
  headers: {
    Authorization: 'Bearer ' + t,
    Accept: 'text/event-stream'
  }
}).then(async r => {
  console.log(r.status, r.headers.get('content-type'));
  const reader = r.body.getReader();
  const res = await reader.read();
  console.log(new TextDecoder().decode(res.value));
  process.exit(0);
});
