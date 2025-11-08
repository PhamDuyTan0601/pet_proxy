const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS cho ESP32
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Config
const TARGET_SERVER = "https://pettracking2.onrender.com";

// Health check - ROOT ENDPOINT
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🐾 Pet Proxy HTTP Server is running!",
    protocol: "HTTP",
    timestamp: new Date().toISOString(),
    endpoints: {
      deviceLookup: "GET /api/devices/pet/:deviceId",
      submitData: "POST /api/petData",
    },
  });
});

// Device lookup - cho ESP32
app.get("/api/devices/pet/:deviceId", async (req, res) => {
  const { deviceId } = req.params;

  console.log(`🔍 [PROXY] Device lookup request: ${deviceId}`);
  console.log(
    `📡 [PROXY] From IP: ${req.ip}, User-Agent: ${req.get("User-Agent")}`
  );

  try {
    const response = await fetch(
      `${TARGET_SERVER}/api/devices/pet/${deviceId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "ESP32-Proxy/1.0",
        },
      }
    );

    const data = await response.json();

    console.log(`✅ [PROXY] Response from target: ${response.status}`);

    res.status(response.status);
    res.json(data);
  } catch (error) {
    console.error("❌ [PROXY] Error:", error.message);
    res.status(502).json({
      success: false,
      message: "Proxy error: Cannot connect to target server",
      error: error.message,
    });
  }
});

// Pet data submission - cho ESP32
app.post("/api/petData", async (req, res) => {
  console.log("📨 [PROXY] Pet data submission received");
  console.log("📊 [PROXY] Data:", JSON.stringify(req.body));
  console.log(`📡 [PROXY] From IP: ${req.ip}`);

  try {
    const response = await fetch(`${TARGET_SERVER}/api/petData`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ESP32-Proxy/1.0",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    console.log(`✅ [PROXY] Data submission response: ${response.status}`);

    res.status(response.status);
    res.json(data);
  } catch (error) {
    console.error("❌ [PROXY] Error:", error.message);
    res.status(502).json({
      success: false,
      message: "Proxy error: Cannot connect to target server",
      error: error.message,
    });
  }
});

// Test endpoint
app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Test endpoint working!",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Pet Proxy HTTP Server running on port ${PORT}`);
  console.log(`🔗 Local: http://0.0.0.0:${PORT}`);
  console.log(`🌐 Public: https://your-repl-name.your-username.repl.co`);
  console.log(`🐾 Ready for ESP32 connections!`);
});
