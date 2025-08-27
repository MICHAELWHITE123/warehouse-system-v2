// Простейший API endpoint для тестирования Vercel
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    message: 'API Test Endpoint Working!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: req.headers,
    success: true
  });
}
