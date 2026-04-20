import type { ErrorHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class AppError extends Error {
  public readonly statusCode: ContentfulStatusCode;
  public readonly details?: unknown;

  constructor(message: string, statusCode: ContentfulStatusCode, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof AppError) {
    return c.json(
      {
        error: error.message,
        details: error.details,
      },
      error.statusCode,
    );
  }

  return c.json(
    {
      error: 'Internal Server Error',
    },
    500,
  );
};
