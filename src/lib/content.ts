import dcsSnap from '@/assets/dcs-snap.jpg'
import infestsnap from '@/assets/infestsnap.jpg'
import onmog from '@/assets/onmog.jpg'

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

/** What the hover preview shows.
 *
 *  `site` is a live frame of the real thing. Two of the three client sites
 *  send no `X-Frame-Options` and no `frame-ancestors`, so they can be framed.
 *  The ones that cannot — onmog.in is `DENY`, Play is `SAMEORIGIN` — ship a
 *  `shot` instead: a still of the same page, or the app's own store artwork. */
export type Preview = {
  kind: 'site' | 'shot'
  src: string
}

export type Work = {
  index: string
  name: string
  kind: string
  blurb: string
  /** where the row goes. Named, not a bare arrow — the destination is the
   *  single thing a visitor wants to know before clicking. */
  dest: string
  href?: string
  preview?: Preview
}

/** Work, banded by what kind of thing it is. The band is the fast read:
 *  shipped apps, client sites, and the one that is not out yet. */
export const WORK: { band: string; items: Work[] }[] = [
  {
    band: 'Mobile apps',
    items: [
      {
        index: '01',
        name: 'DCS Snap',
        kind: 'Android · Niruthi',
        blurb:
          'Field teams collect ground-level crop data and run digital crop surveys from a phone.',
        dest: 'Google Play',
        href: 'https://play.google.com/store/apps/details?id=com.niruthi.dcssnap',
        preview: { kind: 'shot', src: dcsSnap },
      },
      {
        index: '02',
        name: 'Infestsnap',
        kind: 'Android · Niruthi',
        blurb:
          'Weekly crop-infestation forecasts, weather insight and field reporting for crop advisors.',
        dest: 'Google Play',
        href: 'https://play.google.com/store/apps/details?id=com.infestsnapv3',
        preview: { kind: 'shot', src: infestsnap },
      },
      {
        index: '03',
        name: 'Asset Management',
        kind: 'Android · Niruthi',
        blurb: 'Asset tracking built for internal teams rather than the store.',
        dest: 'Internal · unlisted',
      },
    ],
  },
  {
    band: 'Freelance web',
    items: [
      {
        index: '04',
        name: 'Dharani Life Sciences',
        kind: 'Product site',
        blurb:
          'Site for the first rapid test kit that reads snake venom — hemotoxic or neurotoxic — in twenty minutes.',
        dest: 'dharanilifesciences.com',
        href: 'https://www.dharanilifesciences.com/',
        preview: { kind: 'site', src: 'https://www.dharanilifesciences.com/' },
      },
      {
        index: '05',
        name: 'Onmog Softsol',
        kind: 'Studio site',
        blurb:
          'Studio site for a multidisciplinary tech firm — staffing, app and web work, payroll, rail signalling.',
        dest: 'onmog.in',
        href: 'https://www.onmog.in/',
        // the only client site that sets `X-Frame-Options: DENY`, so it is a
        // still of the real page rather than a live frame of it
        preview: { kind: 'shot', src: onmog },
      },
      {
        index: '06',
        name: 'Prodigy HRM',
        kind: 'Web platform',
        blurb: 'HR platform front end — leave, recruitment, onboarding and compliance in one place.',
        dest: 'prodigyhrm.com',
        href: 'https://www.prodigyhrm.com/',
        preview: { kind: 'site', src: 'https://www.prodigyhrm.com/' },
      },
    ],
  },
  {
    band: 'In build',
    items: [
      {
        index: '07',
        name: 'Cable operator platform',
        kind: 'Multi-tenant',
        blurb: 'One deployment, many operators — each tenant isolated from the next.',
        dest: 'Coming soon',
      },
    ],
  },
]

export const SOCIALS = [
  { id: 'github-icon', label: 'GitHub', href: '#' },
  { id: 'x-icon', label: 'X', href: '#' },
  { id: 'bluesky-icon', label: 'Bluesky', href: '#' },
] as const
