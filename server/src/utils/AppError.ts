/**
 * A predictable, "expected" error (bad input, missing resource, no
 * permission, ...). The global error middleware knows these are safe to
 * report to the client verbatim; anything else is an unexpected bug whose
 * details we hide from the client and only log server-side.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational = true;
  readonly code?: string;

  constructor(message: string, statusCode = 400, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, code?: string) {
    return new AppError(message, 400, code);
  }
  static unauthorized(message = 'غير مصرح لك بتنفيذ هذا الإجراء.') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }
  static forbidden(message = 'لا تملك صلاحية الوصول لهذا المورد.') {
    return new AppError(message, 403, 'FORBIDDEN');
  }
  static notFound(message = 'العنصر المطلوب غير موجود.') {
    return new AppError(message, 404, 'NOT_FOUND');
  }
  static conflict(message: string) {
    return new AppError(message, 409, 'CONFLICT');
  }
  static tooManyRequests(message = 'عدد كبير من المحاولات، حاول لاحقاً.') {
    return new AppError(message, 429, 'RATE_LIMITED');
  }
}
