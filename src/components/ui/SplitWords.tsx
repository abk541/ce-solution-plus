import { cn } from '@/lib/cn';

/**
 * Splits a line into per-word masks so a timeline can lift each word from
 * behind a clip edge. Screen readers get the intact string; the word spans are
 * hidden from the accessibility tree.
 */
export function SplitWords({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn('block', className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="block">
        {text.split(' ').map((word, index) => (
          <span
            key={`${word}-${index}`}
            data-word
            className="inline-block overflow-hidden pb-[0.12em] align-bottom"
          >
            <span className="inline-block will-change-transform">
              {word}
              {index < text.split(' ').length - 1 ? '\u00A0' : ''}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
