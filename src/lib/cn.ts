import { twMerge } from 'tailwind-merge';

/**
 * Joins class names and resolves Tailwind conflicts by precedence, so a caller
 * passing `hidden` can actually override a component's base `inline-flex`.
 * A plain join cannot do this — CSS resolves ties by stylesheet order, not by
 * the order classes appear in the attribute.
 */
export function cn(...values: Array<string | false | null | undefined>): string {
  return twMerge(values.filter(Boolean).join(' '));
}
