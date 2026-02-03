import express from 'express';
import type { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'predifi-arena-api',
    timestamp: new Date().toISOString() 
  });
});

// API routes (to be implemented)
app.get('/api/v1/arenas', (_req: Request, res: Response) => {
  res.json({ message: 'Arena listing - coming soon' });
});

app.get('/api/v1/competitions', (_req: Request, res: Response) => {
  res.json({ message: 'Competition listing - coming soon' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Arena API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
