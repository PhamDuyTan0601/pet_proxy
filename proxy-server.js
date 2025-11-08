const express = require('express');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// Config
const TARGET_HOST = 'pettracking2.onrender.com';
const TARGET_PORT = 443;

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - From: ${req.ip}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Pet Proxy Server is running',
    timestamp: new Date().toISOString()
  });
});

// Proxy middleware cho ESP32 routes
app.use('/api/devices/pet/:deviceId', (req, res) => {
  proxyRequest(req, res, 'GET', `/api/devices/pet/${req.params.deviceId}`);
});

app.use('/api/petData', (req, res) => {
  if (req.method === 'POST') {
    proxyRequest(req, res, 'POST', '/api/petData');
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});

// Hàm proxy chính
function proxyRequest(req, res, method, path) {
  console.log(`[PROXY] Forwarding ${method} ${path} to ${TARGET_HOST}`);
  
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: path,
    method: method,
    headers: {
      ...req.headers,
      host: TARGET_HOST,
      'x-forwarded-for': req.ip,
      'x-proxy-source': 'esp32-proxy'
    }
  };

  // Xóa headers không cần thiết
  delete options.headers['accept-encoding'];

  const proxyReq = https.request(options, (proxyRes) => {
    console.log(`[PROXY] Response from target: ${proxyRes.statusCode}`);
    
    // Forward headers
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    
    // Forward data
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[PROXY] Error:', err.message);
    res.status(502).json({ 
      success: false, 
      message: 'Proxy error: Cannot connect to target server' 
    });
  });

  // Forward request body (nếu có)
  if (method === 'POST' && req.body) {
    proxyReq.write(JSON.stringify(req.body));
  }

  proxyReq.end();
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.method} ${req.originalUrl} not found in proxy` 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Pet Proxy Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🎯 Target: https://${TARGET_HOST}`);
});

module.exports = app;