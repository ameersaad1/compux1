import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

type Target = 'body' | 'query' | 'params';

/**
 * Validates req[target] against a Zod schema and replaces it with the
 * parsed (and therefore type-safe, trimmed, coerced) result. Throws a
 * ZodError on failure, which `errorHandler` turns into a 422 response.
 */
export function validate(schema: ZodTypeAny, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req[target] = schema.parse(req[target]);
      next();
    } catch (err) {
      next(err);
    }
  };
}
