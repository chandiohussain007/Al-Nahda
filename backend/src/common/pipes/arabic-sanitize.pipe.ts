import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Strips dangerous Unicode control characters commonly used in Arabic/RTL
 * content to perform UI spoofing or inject bidirectional text attacks.
 *
 * Also strips any HTML tags to prevent stored XSS in text fields.
 *
 * Apply to specific string fields on DTOs via @UsePipes or at the param level.
 */
@Injectable()
export class ArabicSanitizePipe implements PipeTransform<unknown, unknown> {
  /** RTL / bidi override characters and other invisible controls. */
  private static readonly BIDI_CONTROLS =
    /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

  /** Naive HTML tag stripper — removes <tag> patterns. */
  private static readonly HTML_TAGS = /<[^>]*>/g;

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    if (typeof value === 'string') {
      return this.sanitize(value);
    }
    if (value !== null && typeof value === 'object') {
      return this.sanitizeObject(value as Record<string, unknown>);
    }
    return value;
  }

  private sanitize(input: string): string {
    if (input.length > 10_000) {
      throw new BadRequestException('Input text is too long');
    }
    return input
      .replace(ArabicSanitizePipe.BIDI_CONTROLS, '')
      .replace(ArabicSanitizePipe.HTML_TAGS, '');
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = typeof val === 'string' ? this.sanitize(val) : val;
    }
    return result;
  }
}
