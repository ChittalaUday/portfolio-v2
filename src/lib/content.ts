import dcsSnap from '@/assets/dcs-snap.jpg'
import infestsnap from '@/assets/infestsnap.jpg'
import onmog from '@/assets/onmog.jpg'

export const ME = {
  name: 'Uday Chittala',
  role: 'Full-stack engineer',
  email: 'chitalauday@gmail.com',
  location: 'Hyderabad, IN',
  tz: 'Asia/Kolkata',
  status: 'open to work',
  company: 'Niruthi Climate & Ecosystems',
  companyUrl: 'https://niruthi.com',
  github: 'https://github.com/ChittalaUday',
  linkedin: 'https://www.linkedin.com/in/uday-kumar-chittala/',
} as const

export const ABOUT = {
  lede: 'I came to this the long way round — a polytechnic diploma, then a degree I finished while already shipping — and what stuck is how good it feels to watch someone actually use the thing.',
  body: 'Right now that means field software at Niruthi — apps that go out to survey teams and crop advisors, people standing in a field rather than sitting at a desk. That changes how you build: the screen has to make sense in daylight, the data has to survive the trip back, and nobody out there files a bug report, they just quietly stop using it. The rest has been a wide net on purpose — Python automation, a native Android app in Java, three client sites, and right now a weather bot that has to work out what you are actually asking before it can answer. Two years of shipping is not long, and I would rather say so than dress it up.',
  facts: [
    { k: 'Now', v: 'Associate Software Engineer, Niruthi' },
    { k: 'Studied', v: 'B.Tech, Aditya · Diploma, Andhra Polytechnic' },
    { k: 'Since', v: 'Writing code since 2020, shipping since 2022' },
    { k: 'Focus', v: 'React Native · TypeScript · Python' },
    { k: 'Location', v: 'Hyderabad, IN' },
  ],
} as const

/** Sections in page order. The index is the number each section prints. */
export const SECTIONS = [
  { id: 'hero', index: '01', label: 'Hero' },
  { id: 'about', index: '02', label: 'About' },
  { id: 'stack', index: '03', label: 'Stack' },
  { id: 'work', index: '04', label: 'Work' },
  { id: 'path', index: '05', label: 'Path' },
  { id: 'contact', index: '06', label: 'Contact' },
  { id: 'footer', index: '07', label: '—' },
] as const

export type SectionId = (typeof SECTIONS)[number]['id']

export type Stop = {
  period: string
  role: string
  org: string
  href?: string
  note: string
  /** study reads differently from work, and the rail marks it differently */
  kind: 'work' | 'study'
  /** the one still running — it gets the live marker */
  current?: boolean
}

/**
 * Ordered by when each thing started, most recent first — so the rail never
 * runs backwards. Study and work overlap by two years; the periods say so
 * rather than the order trying to hide it.
 */
export const PATH: Stop[] = [
  {
    period: 'Jan 2026 — present',
    role: 'Associate Software Engineer',
    org: 'Niruthi Climate & Ecosystems',
    href: 'https://niruthi.com',
    note: 'Android apps for crop survey and pest forecasting, and the services behind them. Converted from the internship in January, with the degree still to finish.',
    kind: 'work',
    current: true,
  },
  {
    period: 'Jul — Dec 2025',
    role: 'Software Engineer Intern',
    org: 'Niruthi Climate & Ecosystems',
    href: 'https://niruthi.com',
    note: 'Six months on the mobile stack — React Native, Expo, and the first production releases.',
    kind: 'work',
  },
  {
    period: '2023 — 2026',
    role: 'B.Tech',
    org: 'Aditya College of Engineering and Technology',
    note: 'Lateral entry from the diploma, so three years rather than four. Graduated April 2026, by then already working full time.',
    kind: 'study',
  },
  {
    period: 'Aug 2022 — Jan 2023',
    role: 'Intern',
    org: 'Incrivelsoft',
    href: 'https://incrivelsoft.com/',
    note: 'Six months on web scraping and automation, plus a native Android app in Java for an internal health product.',
    kind: 'work',
  },
  {
    period: '2020 — 2023',
    role: 'Diploma, Computer Engineering',
    org: 'Andhra Polytechnic, Kakinada',
    note: 'CME. Three years, and the route into the B.Tech.',
    kind: 'study',
  },
]

export const STACK = [
  {
    band: 'Languages',
    items: [
      { name: 'TypeScript', note: 'the default for everything' },
      { name: 'JavaScript', note: 'where it is already the language' },
      { name: 'Python', note: 'scraping, automation, AI work' },
      { name: 'Kotlin', note: 'native Android' },
      { name: 'Java', note: 'the Android work before Kotlin, and Spring' },
      { name: 'Swift', note: 'native iOS' },
      { name: 'SQL', note: 'Postgres, mostly by hand' },
    ],
  },
  {
    band: 'Mobile',
    items: [
      { name: 'React Native', note: 'two years · shipped to Play' },
      { name: 'Expo', note: 'EAS build, update, the whole pipeline' },
      { name: 'Android', note: 'Kotlin, when native is the answer' },
      { name: 'iOS', note: 'Swift' },
    ],
  },
  {
    band: 'Web',
    items: [
      { name: 'React', note: 'every front end I build' },
      { name: 'Next.js', note: 'App Router' },
      { name: 'Vite', note: 'including this site' },
      { name: 'Fastify', note: 'default for a new service' },
      { name: 'Express', note: 'when the ecosystem expects it' },
    ],
  },
  {
    band: 'AI coding',
    items: [
      { name: 'Claude', note: 'Claude Code, in the terminal' },
      { name: 'Codex', note: 'the OpenAI agent CLI' },
      { name: 'Hermes', note: 'in the rotation' },
      { name: 'Antigravity', note: 'Google, agent-first IDE' },
    ],
  },
  {
    band: 'Data & infra',
    items: [
      { name: 'Postgres', note: 'Neon and Supabase' },
      { name: 'Supabase', note: 'auth, storage, row-level security' },
      { name: 'Firebase', note: 'auth and push on mobile' },
      { name: 'Redis', note: 'cache and queues' },
      { name: 'Kafka', note: 'event streams' },
      { name: 'Git', note: 'and the review habits around it' },
    ],
  },
] as const

/** Honest about the difference between what I ship and what I have only
 *  practised. Kept out of the marquee for exactly that reason. */
export const ALSO = {
  label: 'Also',
  items: [
    'system design, the basics',
    'Angular and Spring Boot, from college projects',
  ],
} as const

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
        name: 'Weather bot',
        kind: 'Bot · AI',
        blurb:
          'Weather asked for in plain language. Intent classification works out what is actually being asked before anything goes looking for a forecast.',
        dest: 'In progress',
      },
      {
        index: '08',
        name: 'Cable operator platform',
        kind: 'Multi-tenant',
        blurb: 'One deployment, many operators — each tenant isolated from the next.',
        dest: 'Coming soon',
      },
    ],
  },
]

export const SOCIALS = [
  { id: 'github-icon', label: 'GitHub', href: ME.github },
  { id: 'linkedin-icon', label: 'LinkedIn', href: ME.linkedin },
] as const
