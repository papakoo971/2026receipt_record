import { Request, Response, NextFunction } from 'express';

export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized. Please login first.' });
}

export function isOwner(resourceType: 'business' | 'budgetItem' | 'receipt') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // This middleware will be used to verify ownership of resources
    // Implementation depends on the specific route
    next();
  };
}
