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

// Target server
const TARGET_SERVER = "https://pettracking2.onrender.com";

// Health check
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

// Proxy: Device Lookup
app.get("/api/devices/pet/:deviceId", async (req, res) => {
  const deviceId = req.params.deviceId;
  console.log(`🔍 Device lookup: ${deviceId}`);

  try {
    const response = await fetch(
      `${TARGET_SERVER}/api/devices/pet/${deviceId}`
    );
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    console.error("❌ Proxy error:", error.message);
    res.status(502).json({
      success: false,
      message: "Proxy error",
    });
  }
});

// Proxy: Submit Pet Data
app.post("/api/petData", async (req, res) => {
  console.log("📨 Pet data received:", req.body);

  try {
    const response = await fetch(`${TARGET_SERVER}/api/petData`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("❌ Proxy error:", error.message);
    res.status(502).json({
      success: false,
      message: "Proxy error",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Pet Proxy HTTP Server running on port ${PORT}`);
  console.log(`🔗 ESP32 can send HTTP to this server!`);
});
