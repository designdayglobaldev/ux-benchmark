async function test() {
  try {
    const appsRes = await fetch('http://localhost:4000/api/v1/apps?lite=true');
    const apps = await appsRes.json();
    if (!apps.length) return;
    
    const payload = {
      appId: apps[0].id,
      name: "Test Screen " + Date.now(),
      slug: "test-screen-" + Date.now(),
      imageUrl: "https://example.com/image.jpg",
      screenNo: "NaN" // What if screenNo is "NaN"?
    };

    const res = await fetch('http://localhost:4000/api/v1/screens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (err) {
    console.error(err);
  }
}

test();
