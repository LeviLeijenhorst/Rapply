import type { Request, Response, NextFunction } from "express"

// Intent: asyncHandler
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

// Intent: sendError
export function sendError(res: Response, status: number, message: string) {
  res.status(status).json({ error: message })
}

