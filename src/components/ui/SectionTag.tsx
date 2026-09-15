import { ScrambleText } from '@/components/ui/ScrambleText';
import { cn } from '@/lib/cn';

type SectionTagProps = {
  children: string;
  /** Two-digit schematic index rendered before the label. */
  index?: string;
  tone?: 'dark' | 'light';
  className?: string;
};

/**
 * The repeating "instrument label" that keys every section. Monospace, tracked
 * out, prefixed by a hairline and an index — the page's structural signature.
 * The label decodes out of noise as the section enters.
 */
export function SectionTag({ children, index, tone = 'dark', className }: SectionTagProps) {
  const isLight = tone === 'light';

  return (
    <div
      className={cn(
        'flex items-center gap-3 label-mono',
        isLight ? 'text-ink-500' : 'text-steel-400',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('h-px w-8', isLight ? 'bg-accent-ink/70' : 'bg-accent/70')}
      />
      {index ? (
        <span className={cn('tabular-nums', isLight ? 'text-accent-ink' : 'text-accent')}>
          {index}
        </span>
      ) : null}
      <ScrambleText text={children} />
    </div>
  );
}
