import { Request, Response, NextFunction } from 'express';

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token || token !== process.env.AUTH_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
};
