import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request to include id
declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
  }
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  req.id = uuidv4(); // generate unique ID
  res.setHeader('X-Request-Id', req.id);
  next();
}
