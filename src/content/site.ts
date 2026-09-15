/**
 * CE Solution Plus — site content.
 *
 * Single source of truth for all copy. Edit here, not in components.
 *
 * SOURCING CONVENTION
 *   Anything marked `PLACEHOLDER` below was written to make the page feel complete
 *   and is NOT sourced from client-supplied facts. It must be verified, replaced,
 *   or deleted before launch. Verified facts (company identity, the six service
 *   lines, contact details) carry no marker.
 */

export type NavLink = { label: string; href: string };

export type Capability = {
  id: string;
  index: string;
  title: string;
  summary: string;
  /** PLACEHOLDER: illustrative capability callouts — confirm with the client. */
  detail: string[];
};

export type Market = {
  id: string;
  title: string;
  description: string;
  imageSeed: string;
};

export type Differentiator = {
  id: string;
  label: string;
  title: string;
  body: string;
};

export const company = {
  name: 'CE Solution Plus',
  shortName: 'CE Solution Plus',
  initials: 'CE',
  designation: 'Veteran & Woman-Owned Small Business',
  designationShort: 'VOSB / WOSB',
  tagline: 'Mission support, held to standard.',
  url: 'https://cesolutionplus.com',
  address: {
    street: '3007 43rd Street, Ste 1',
    city: 'Astoria',
    state: 'NY',
    zip: '11103',
    country: 'USA',
  },
  email: 'siblini@cesolutionplus.com',
  phone: '(718) 587-9987',
  phoneHref: '+17185879987',
  // Sourced from cesolutionplus.com.
  social: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/98601299/' },
    { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61569948033281' },
  ],
} as const;

export const navLinks: NavLink[] = [
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'About', href: '#about' },
  { label: 'Markets', href: '#markets' },
  { label: 'Contact', href: '#contact' },
];

export const hero = {
  eyebrow: 'Veteran & Woman-Owned Small Business',
  // The four service verbs carry the hero on their own. Anything longer here
  // competes with the logo animation instead of supporting it.
  headline: ['Staff.', 'Sustain.', 'Train.', 'Build.'],
  lede: 'Mission support for national security, intelligence, and cyber programs.',
  primaryCta: { label: 'Request capabilities', href: '#contact' },
};

export const about = {
  label: 'Who we are',
  statement: ['A small business by size.', 'Not by standard.'],
  // Condensed from the company's own "Who we are" copy on cesolutionplus.com.
  body: [
    'A dynamic small business providing supportive services informed by a deep understanding of proven technology applications. Our team is drawn from military, government, and private-sector programs, and we serve as a trusted partner to assure mission success.',
  ],
  pullQuote: 'Our clients do not hire us to be impressive. They hire us to be reliable.',
  credentials: [
    { label: 'Veteran-Owned', note: 'VOSB' },
    { label: 'Woman-Owned', note: 'WOSB' },
    { label: 'Intelligence & Cyber', note: 'Core specialization' },
  ],
  stats: [
    { value: '6', label: 'Service lines', unit: '' },
    { value: '3', label: 'Sectors our experts come from', unit: '' },
    { value: '100', label: 'Veteran & woman-owned', unit: '%' },
  ],
};

export const capabilities: Capability[] = [
  {
    id: 'staffing',
    index: '01',
    title: 'Staffing Services',
    summary:
      'World-class service and acquisition support, matched to the billet, the program, and the timeline — so requirements get covered without a gap in delivery.',
    detail: [
      'Acquisition and program support personnel',
      'Surge, backfill, and sustained coverage',
      'Role-specific vetting and onboarding',
    ],
  },
  {
    id: 'facility-operations',
    index: '02',
    title: 'Facility Operations & Maintenance',
    summary:
      'Day-to-day operation and upkeep of the buildings and infrastructure that mission work depends on, run to a documented standard rather than to complaint volume.',
    detail: [
      'Preventive and corrective maintenance',
      'Building systems and grounds operations',
      'Compliance and condition reporting',
    ],
  },
  {
    id: 'training',
    index: '03',
    title: 'Training Services',
    summary:
      'Instruction built by people who have done the work, designed so capability transfers to the team and survives turnover.',
    detail: [
      'Curriculum design and courseware',
      'Instructor-led and on-site delivery',
      'Readiness assessment and refresh cycles',
    ],
  },
  {
    id: 'professional',
    index: '04',
    title: 'Professional Services',
    summary:
      'Performance-based solutions across a wide range of technical disciplines, with deep specialization in the intelligence and cyber communities.',
    detail: [
      'Intelligence and cyber community support',
      'Technical and subject-matter expertise',
      'Performance-based, outcome-measured delivery',
    ],
  },
  {
    id: 'construction',
    index: '05',
    title: 'Construction Services',
    summary:
      'Build and modification work delivered with the scheduling discipline and site control that operational environments require.',
    detail: [
      'Renovation, fit-out, and modification',
      'Site coordination and safety management',
      'Schedule and closeout documentation',
    ],
  },
  {
    id: 'transportation',
    index: '06',
    title: 'Transportation Services',
    summary:
      'Movement of people and materiel with the tracking, accountability, and timing that downstream operations are counting on.',
    detail: [
      'Scheduled and on-demand movement',
      'Chain-of-custody and accountability',
      'Route, timing, and contingency planning',
    ],
  },
];

export const differentiators = {
  label: 'Why CE Solution Plus',
  /** The kinetic/glitch signature moment — used exactly once on the site. */
  kineticWord: 'Advantage',
  headline: 'A contracting advantage, not just a capability statement.',
  lede:
    'Small-business status is the entry point. What follows it is the reason clients stay.',
  items: [
    {
      id: 'set-aside',
      label: '01',
      title: 'VOSB & WOSB set-aside eligible',
      body:
        'Veteran and woman-owned status is a real instrument in federal acquisition. It gives contracting officers a direct, defensible path to award — and gives primes a subcontracting partner that strengthens their own small-business plan.',
    },
    {
      id: 'firsthand',
      label: '02',
      title: 'Expertise that has been on the other side of the contract',
      body:
        'Our team is made up of leading experts from military, government, and private-sector programs. They have written the requirement, run the program, and lived with the result — so they read a statement of work the way the customer meant it.',
    },
    {
      id: 'intel-cyber',
      label: '03',
      title: 'Intelligence and cyber as a specialization',
      body:
        'The intelligence and cyber communities have their own pace, their own constraints, and no patience for a learning curve. We staff and support them as a focus area, not as an adjacent market.',
    },
    {
      id: 'performance',
      label: '04',
      title: 'Performance-based delivery',
      body:
        'Scope is defined by outcome, measured against it, and reported honestly. If something is at risk, the customer hears it from us before it becomes their problem.',
    },
    {
      id: 'partner',
      label: '05',
      title: 'A trusted partner, not a staffing vendor',
      body:
        'We are accountable for mission success, not for filling seats. That distinction shows up in who we put forward, what we flag, and what we refuse to take on.',
    },
  ] satisfies Differentiator[],
};

export const markets = {
  label: 'Markets we serve',
  headline: 'Built for environments where the margin for error is already spent.',
  lede:
    'These are the operating environments our six service lines are designed around — from national security technology programs to the facilities and logistics that keep them running.',
  items: [
    {
      id: 'national-security',
      title: 'National Security Technology',
      description:
        'Professional and technical services that raise the operational impact of the systems the nation depends on.',
      imageSeed: 'ce-national-security',
    },
    {
      id: 'intelligence',
      title: 'Intelligence Community',
      description:
        'Specialized support for organizations where access, discretion, and pace are non-negotiable conditions of the work.',
      imageSeed: 'ce-intelligence',
    },
    {
      id: 'cyber',
      title: 'Cyber Operations',
      description:
        'Technical staffing and performance-based support for cyber mission teams and the programs that sustain them.',
      imageSeed: 'ce-cyber',
    },
    {
      id: 'facilities',
      title: 'Federal Facilities & Infrastructure',
      description:
        'Operations, maintenance, and construction for the physical plant behind the mission — kept at standard, not at minimum.',
      imageSeed: 'ce-facilities',
    },
    {
      id: 'readiness',
      title: 'Training & Readiness',
      description:
        'Instruction and courseware that move capability into the team and keep it there through rotation and turnover.',
      imageSeed: 'ce-readiness',
    },
    {
      id: 'logistics',
      title: 'Logistics & Transportation',
      description:
        'Accountable movement of people and materiel, planned against the schedule the mission is actually running on.',
      imageSeed: 'ce-logistics',
    },
  ] satisfies Market[],
};

export const trust = {
  label: 'The standard',
  statement: ['When the mission', 'cannot pause,', 'the support cannot either.'],
  body:
    'Continuity is not a premium feature of what we do. It is the baseline we are hired against. Our clients measure our performance by theirs — which is exactly how we want it measured.',
  cta: { label: 'Start the conversation', href: '#contact' },
};

export const contact = {
  label: 'Contact',
  headline: 'Send us the requirement.',
  lede:
    'Contracting officers, program managers, and prime teaming partners: tell us what you need covered and who it is for. You will hear back from a person who can actually speak to the work.',
  interests: [
    'Staffing Services',
    'Facility Operations & Maintenance',
    'Training Services',
    'Professional Services',
    'Construction Services',
    'Transportation Services',
    'Teaming / Subcontracting',
    'Other',
  ],
};

export const footer = {
  statement: 'Our mission is your success.',
  // PLACEHOLDER: confirm the correct registration/identifier lines before launch.
  registrations: [
    'Veteran-Owned Small Business (VOSB)',
    'Woman-Owned Small Business (WOSB)',
    'SAM registration — verify UEI / CAGE before publishing',
  ],
};
