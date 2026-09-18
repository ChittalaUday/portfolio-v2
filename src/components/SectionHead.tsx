/** The monospace slug that opens every section. Decorative — the real
 *  heading is a sibling h2. */
export function Slug({ index, label, className = '' }: { index: string; label: string; className?: string }) {
  return (
    <p aria-hidden="true" className={`mono-label flex items-center gap-3 ${className}`}>
      <span>{index}</span>
      <span className="h-px w-6 bg-current opacity-40" />
      <span>{label}</span>
    </p>
  )
}
