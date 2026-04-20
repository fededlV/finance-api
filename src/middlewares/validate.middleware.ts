import type { MiddlewareHandler } from 'hono';
import type { ZodTypeAny } from 'zod';
import { ZodError } from 'zod';
import { AppError } from './error.middleware';

export const validateBody = (schema: ZodTypeAny): MiddlewareHandler => {
  return async (c, next) => {
    let rawBody: unknown;

    try {
      rawBody = await c.req.json();
    } catch {
      throw new AppError('Body JSON invalido.', 400);
    }

    try {
      const parsed = await schema.parseAsync(rawBody);
      c.set('validatedBody', parsed);
      await next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        throw new AppError('Error de validacion.', 422, error.flatten());
      }

      throw error;
    }
  };
};
