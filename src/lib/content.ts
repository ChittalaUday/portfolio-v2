export const ME = {
  name: 'Uday Chittala',
  role: 'Full-stack engineer',
  email: 'uday.kumar@niruthi.com',
  location: 'Hyderabad, IN',
  tz: 'Asia/Kolkata',
  status: 'available for work',
} as const

export const ABOUT = {
  lede: 'I build product surfaces that hold up under real traffic — the interface, the API behind it, and the boring parts in between.',
  body: 'Most of my work is the unglamorous middle: turning a design that only exists as a screenshot into something typed, tested and shipped. I care about the seams — how a list behaves at ten thousand rows, what the empty state says, whether the thing still works on a bad connection.',
  facts: [
    { k: 'Location', v: 'Hyderabad, IN' },
    { k: 'Focus', v: 'Product engineering · React · TypeScript' },
    { k: 'Writing', v: 'Occasionally, about interfaces' },
  ],
} as const

/** Sections that get a bloub companion + nav entry. */
export const SECTIONS = [
  { id: 'hero', index: '01', label: 'Hero' },
  { id: 'about', index: '02', label: 'About' },
  { id: 'stack', index: '03', label: 'Stack' },
  { id: 'work', index: '04', label: 'Work' },
  { id: 'contact', index: '05', label: 'Contact' },
  { id: 'footer', index: '06', label: '—' },
] as const

export type SectionId = (typeof SECTIONS)[number]['id']

export const STACK = [
  {
    band: 'Languages',
    items: [
      { name: 'TypeScript', note: '6 yrs · everything ships in it' },
      { name: 'Python', note: '5 yrs · services and glue' },
      { name: 'SQL', note: 'Postgres, mostly by hand' },
      { name: 'Go', note: '2 yrs · when latency matters' },
    ],
  },
  {
    band: 'Frameworks',
    items: [
      { name: 'React', note: '6 yrs · 14 apps shipped' },
      { name: 'Next.js', note: 'App Router since it was unstable' },
      { name: 'Tailwind', note: 'v4, CSS-first tokens' },
      { name: 'FastAPI', note: 'Default for anything Python' },
    ],
  },
  {
    band: 'Infrastructure',
    items: [
      { name: 'Postgres', note: 'Constraints over app-layer checks' },
      { name: 'Docker', note: 'Same image local and prod' },
      { name: 'AWS', note: 'ECS, RDS, S3, not much else' },
      { name: 'Vite', note: 'Build times measured in ms' },
    ],
  },
] as const

export type Project = {
  index: string
  name: string
  kind: string
  year: string
  blurb: string
  tech: string[]
  live?: string
  source?: string
}

export const PROJECTS: Project[] = [
  {
    index: '01',
    name: 'Ledger',
    kind: 'Fintech dashboard',
    year: '2026',
    blurb:
      'Reconciliation tooling for a payments team drowning in spreadsheets. The hard part was not the maths — it was making a 40-column table readable, and letting an analyst undo a bad import without a support ticket.',
    tech: ['React', 'TypeScript', 'Postgres', 'FastAPI'],
    live: '#',
    source: '#',
  },
  {
    index: '02',
    name: 'Atlas',
    kind: 'Design system',
    year: '2025',
    blurb:
      'Forty-odd components and the tokens under them, adopted by four product teams. Shipped with codemods, because a design system nobody can migrate to is a styleguide.',
    tech: ['React', 'Tailwind', 'Radix', 'Storybook'],
    live: '#',
    source: '#',
  },
  {
    index: '03',
    name: 'Signal',
    kind: 'Realtime analytics',
    year: '2025',
    blurb:
      'Event pipeline and the dashboard on top of it, from ingest to chart. Handles roughly 12k events a second on three boxes, which is less impressive than it sounds and took longer than it should have.',
    tech: ['Go', 'ClickHouse', 'React', 'WebSockets'],
    live: '#',
  },
  {
    index: '04',
    name: 'Harbour',
    kind: 'Internal platform',
    year: '2024',
    blurb:
      'Self-service deploys for engineers who did not want to learn Terraform. Cut the median time-to-staging from two days to eleven minutes, mostly by deleting steps rather than automating them.',
    tech: ['TypeScript', 'AWS', 'Docker', 'Terraform'],
    source: '#',
  },
  {
    index: '05',
    name: 'Quarry',
    kind: 'Search',
    year: '2024',
    blurb:
      'Full-text and vector search over a decade of internal documents. The retrieval was straightforward; making the results feel trustworthy was not.',
    tech: ['Python', 'Postgres', 'pgvector', 'React'],
    live: '#',
    source: '#',
  },
  {
    index: '06',
    name: 'Kiln',
    kind: 'Developer tool',
    year: '2023',
    blurb:
      'A CLI that turns an OpenAPI spec into typed clients nobody has to hand-edit. Small, boring, and still in use, which is the highest compliment a tool gets.',
    tech: ['Go', 'OpenAPI', 'CI'],
    source: '#',
  },
]

export const SOCIALS = [
  { id: 'github-icon', label: 'GitHub', href: '#' },
  { id: 'x-icon', label: 'X', href: '#' },
  { id: 'bluesky-icon', label: 'Bluesky', href: '#' },
] as const
