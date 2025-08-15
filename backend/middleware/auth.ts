import { Request, Response, NextFunction } from 'express';

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  if (!t || t !== process.env.AUTH_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
};