import type { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Wraps an async controller method so a rejected promise is forwarded to
 * Express's error middleware instead of crashing the process or hanging the
 * request. Without this, every controller needs a manual try/catch.
 */
export function asyncHandler<Req extends Request = Request>(handler: AsyncRouteHandler<Req>) {
  return (req: Req, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}
