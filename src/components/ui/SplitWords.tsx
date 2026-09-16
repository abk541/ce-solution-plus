import { cn } from '@/lib/cn';

/**
 * Splits a line into per-word masks so a timeline can lift each word from
 * behind a clip edge. The visible word spans remain the single readable text
 * layer, so assistive technology gets the same content without an ARIA proxy.
 */
export function SplitWords({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn('block', className)}>
      {text.split(' ').map((word, index) => (
        <span
          key={`${word}-${index}`}
          data-word
          className="inline-block overflow-hidden pb-[0.12em] align-bottom"
        >
          <span className="inline-block">
            {word}
            {index < text.split(' ').length - 1 ? '\u00A0' : ''}
          </span>
        </span>
      ))}
    </span>
  );
}
