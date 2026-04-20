import { Request, Response, NextFunction } from 'express'

interface AppError extends Error {
  statusCode?: number
}

/**
 * Central error handler.
 * All routes call next(err) on failure — it lands here.
 * Keeps error formatting consistent across every endpoint.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500

  console.error(`[${new Date().toISOString()}] ${statusCode} — ${err.message}`)

  res.status(statusCode).json({
    error:   err.message ?? 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}