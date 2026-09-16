import { sitePath } from '@/lib/site-path';

/**
 * Persistent page substrate: a fine schematic grid, four full-height column
 * rules, and a static film grain. Fixed, non-interactive, and low enough in
 * contrast to register as texture rather than decoration.
 */
export function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 grid-lines opacity-[0.55]" />

      {/* Column rules — anchor the schematic grid the sections are laid out on. */}
      <div className="shell absolute inset-x-0 top-0 h-full">
        <div className="relative hidden h-full md:block">
          {[0, 25, 50, 75, 100].map((left) => (
            <span
              key={left}
              className="absolute top-0 h-full w-px bg-linear-to-b from-transparent via-ink-700/70 to-transparent"
              style={{ left: `${left}%` }}
            />
          ))}
        </div>
      </div>

      {/* Radial falloff keeps the grid from competing with body copy. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_0%,var(--color-ink-950)_78%)]" />

      <div
        className="absolute inset-0 hidden opacity-[0.035] mix-blend-screen [background-size:180px_180px] md:block"
        style={{ backgroundImage: `url("${sitePath('/images/grain.svg')}")` }}
      />
    </div>
  );
}
