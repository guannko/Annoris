// backend/middleware/auth_v2.ts
// Flexible auth middleware that supports beacon (token in body/query)
import { Request, Response, NextFunction } from 'express';

export const auth = (req: Request, res: Response, next: NextFunction) => {
  // Try to get token from multiple sources (for beacon compatibility)
  const header = (req.headers.authorization || '').replace('Bearer ', '').trim();
  const bodyToken = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  const queryToken = typeof (req.query as any)?.token === 'string' ? String((req.query as any).token).trim() : '';
  
  // Use first available token
  const token = header || bodyToken || queryToken;

  if (!token || token !== process.env.AUTH_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  
  // Remove token from body to avoid passing it downstream
  if (req.body?.token) {
    delete req.body.token;
  }
  
  next();
};