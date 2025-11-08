const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// CORS cho ESP32
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Target server - SỬA THÀNH URL ĐẦY ĐỦ
const TARGET_SERVER = "https://pettracking2.onrender.com";

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🐾 Pet Proxy HTTP Server is running!",
    protocol: "HTTP",
    timestamp: new Date().toISOString(),
    target: TARGET_SERVER,
    endpoints: {
      deviceLookup: "GET /api/devices/pet/:deviceId",
      submitData: "POST /api/petData",
    },
  });
});

// Proxy: Device Lookup - THÊM ERROR HANDLING
app.get("/api/devices/pet/:deviceId", async (req, res) => {
  const deviceId = req.params.deviceId;
  console.log(`🔍 [PROXY] Device lookup: ${deviceId}`);

  try {
    const targetURL = `${TARGET_SERVER}/api/devices/pet/${deviceId}`;
    console.log(`📡 [PROXY] Forwarding to: ${targetURL}`);

    const response = await fetch(targetURL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ESP32-Proxy/1.0",
      },
      timeout: 10000, // 10 seconds timeout
    });

    if (!response.ok) {
      throw new Error(`Target server responded with ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ [PROXY] Success: ${response.status}`);

    res.status(response.status).json(data);
  } catch (error) {
    console.error("❌ [PROXY] Error:", error.message);
    res.status(502).json({
      success: false,
      message: "Proxy error: Cannot connect to target server",
      error: error.message,
      target: TARGET_SERVER,
    });
  }
});

// Proxy: Submit Pet Data
app.post("/api/petData", async (req, res) => {
  console.log("📨 [PROXY] Pet data received:", req.body);

  try {
    const targetURL = `${TARGET_SERVER}/api/petData`;
    console.log(`📡 [PROXY] Forwarding to: ${targetURL}`);

    const response = await fetch(targetURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ESP32-Proxy/1.0",
      },
      body: JSON.stringify(req.body),
      timeout: 10000,
    });

    if (!response.ok) {
      throw new Error(`Target server responded with ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ [PROXY] Data saved: ${response.status}`);

    res.status(response.status).json(data);
  } catch (error) {
    console.error("❌ [PROXY] Error:", error.message);
    res.status(502).json({
      success: false,
      message: "Proxy error: Cannot connect to target server",
      error: error.message,
    });
  }
});

// Test endpoint đến server chính
app.get("/test-target", async (req, res) => {
  try {
    const response = await fetch(`${TARGET_SERVER}/test`);
    const data = await response.json();
    res.json({
      proxy: "OK",
      target: data,
    });
  } catch (error) {
    res.status(502).json({
      error: "Cannot reach target server",
      details: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Pet Proxy HTTP Server running on port ${PORT}`);
  console.log(
    `🔗 URL: https://3f9d870b-1a91-4ec2-a27f-686ada8b9a07-00-1614ecdvgxkta.pike.replit.dev`
  );
  console.log(`🎯 Target: ${TARGET_SERVER}`);
});
