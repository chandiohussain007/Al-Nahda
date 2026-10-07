import { PayloadTooLargeException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/** Maximum accepted multipart (file) upload size: 1 MB. */
export const MAX_UPLOAD_BYTES = 1024 * 1024;

/**
 * Rejects multipart file uploads larger than MAX_UPLOAD_BYTES with 413.
 * JSON bodies pass through untouched. No multipart route exists today, so this
 * guard binds any file-upload route added later (media is URL-based for now).
 */
export function maxUploadSize(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const contentType = String(req.headers['content-type'] ?? '');
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    next();
    return;
  }

  const contentLength = Number(req.headers['content-length'] ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
    next(
      new PayloadTooLargeException(
        `File exceeds the ${MAX_UPLOAD_BYTES} byte (1MB) upload limit.`,
      ),
    );
    return;
  }

  next();
}