import { BloubMark } from '@/components/BloubMark'
import type { EXPRESSIONS } from '@/lib/bloub'

/** The monospace slug that opens every section. Decorative — the real
 *  heading is a sibling h2.
 *
 *  `face` names an expression to show beside it as a live mark that looks at
 *  the pointer. It takes no colour of its own: BloubMark fills with
 *  `currentColor`, so it comes out ink on the paper sections and near-white on
 *  the ink ones without being told which. */
export function Slug({
  index,
  label,
  className = '',
  face,
  size = 36,
}: {
  index: string
  label: string
  className?: string
  /** which expression to show beside the slug; omit for no mark */
  face?: keyof typeof EXPRESSIONS
  size?: number
}) {
  const slug = (
    <p aria-hidden="true" className={`mono-label flex items-center gap-3 ${face ? '' : className}`}>
      <span>{index}</span>
      <span className="h-px w-6 bg-current opacity-40" />
      <span>{label}</span>
    </p>
  )
  if (!face) return slug
  return (
    <div className={`flex items-center gap-5 ${className}`}>
      {slug}
      <BloubMark expression={face} style={{ width: size, height: size }} />
    </div>
  )
}
