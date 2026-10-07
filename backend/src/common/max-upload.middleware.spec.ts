import { PayloadTooLargeException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { MAX_UPLOAD_BYTES, maxUploadSize } from './max-upload.middleware.js';

function run(headers: Record<string, string>) {
  const req = { headers } as unknown as Request;
  const res = {} as Response;
  const next = vi.fn();
  maxUploadSize(req, res, next as unknown as NextFunction);
  return next;
}

describe('maxUploadSize', () => {
  it('exports a 1MB limit', () => {
    expect(MAX_UPLOAD_BYTES).toBe(1024 * 1024);
  });

  it('rejects a multipart body over the limit with 413', () => {
    const next = run({
      'content-type': 'multipart/form-data; boundary=x',
      'content-length': String(MAX_UPLOAD_BYTES + 1),
    });

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(PayloadTooLargeException);
    expect(err.getStatus()).toBe(413);
  });

  it('accepts a multipart body exactly at the limit', () => {
    const next = run({
      'content-type': 'multipart/form-data; boundary=x',
      'content-length': String(MAX_UPLOAD_BYTES),
    });

    expect(next).toHaveBeenCalledWith();
  });

  it('accepts a multipart body with no content-length', () => {
    const next = run({ 'content-type': 'multipart/form-data; boundary=x' });

    expect(next).toHaveBeenCalledWith();
  });

  it('never blocks JSON regardless of size', () => {
    const next = run({
      'content-type': 'application/json',
      'content-length': String(MAX_UPLOAD_BYTES * 10),
    });

    expect(next).toHaveBeenCalledWith();
  });
});