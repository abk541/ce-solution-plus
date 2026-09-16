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

export type NavLink = { label: string; href: string; index: string };

export type Capability = {
  id: string;
  index: string;
  title: string;
  summary: string;
  /** PLACEHOLDER: illustrative capability tags — confirm with the client. */
  tags: string[];
};

export type Market = {
  id: string;
  title: string;
  description: string;
  /** PLACEHOLDER: illustrative market tags — confirm with the client. */
  tags: string[];
  imageSeed: string;
};

export type Differentiator = {
  id: string;
  label: string;
  title: string;
  body: string;
  /** PLACEHOLDER: illustrative differentiator tags — confirm with the client. */
  tags: string[];
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
  { label: 'About', href: '#about', index: '01' },
  { label: 'Capabilities', href: '#capabilities', index: '02' },
  { label: 'Why us', href: '#why-us', index: '03' },
  { label: 'Markets', href: '#markets', index: '04' },
  { label: 'Contact', href: '#contact', index: '06' },
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
    summary: 'Acquisition and program support matched to the role, mission, and delivery timeline.',
    tags: ['Program support', 'Surge coverage', 'Role vetting'],
  },
  {
    id: 'facility-operations',
    index: '02',
    title: 'Facility Operations & Maintenance',
    summary: 'Operations and maintenance for the facilities and infrastructure that support mission work.',
    tags: ['Preventive maintenance', 'Building systems', 'Condition reporting'],
  },
  {
    id: 'training',
    index: '03',
    title: 'Training Services',
    summary: 'Practical instruction designed to transfer capability and sustain readiness through turnover.',
    tags: ['Courseware design', 'On-site delivery', 'Readiness cycles'],
  },
  {
    id: 'professional',
    index: '04',
    title: 'Professional Services',
    summary: 'Technical and subject-matter support focused on intelligence and cyber programs.',
    tags: ['Intelligence support', 'Cyber support', 'Technical expertise'],
  },
  {
    id: 'construction',
    index: '05',
    title: 'Construction Services',
    summary: 'Renovation and modification work planned for controlled operational environments.',
    tags: ['Renovation / fit-out', 'Site coordination', 'Project closeout'],
  },
  {
    id: 'transportation',
    index: '06',
    title: 'Transportation Services',
    summary: 'Accountable movement of people and materiel aligned to operational schedules.',
    tags: ['Scheduled movement', 'Chain of custody', 'Contingency planning'],
  },
];

export const differentiators = {
  label: 'Why CE Solution Plus',
  /** The kinetic/glitch signature moment — used exactly once on the site. */
  kineticWord: 'accountability',
  headline: 'Small-business value. Delivery accountability.',
  lede: 'Ownership status may support acquisition goals; performance determines the lasting partnership.',
  items: [
    {
      id: 'set-aside',
      label: '01',
      title: 'Veteran- and woman-owned',
      body: 'CE Solution Plus is veteran- and woman-owned. Eligibility should be confirmed against each solicitation and applicable program requirements.',
      tags: ['Veteran owned', 'Woman owned', 'Small business'],
    },
    {
      id: 'firsthand',
      label: '02',
      title: 'Cross-sector experience',
      body: 'Our team draws on military, government, and private-sector program experience to understand requirements in operating context.',
      tags: ['Military experience', 'Government experience', 'Private-sector experience'],
    },
    {
      id: 'intel-cyber',
      label: '03',
      title: 'Intelligence & cyber focus',
      body: 'Intelligence and cyber are core focus areas within our professional and technical support.',
      tags: ['Intelligence support', 'Cyber support', 'Mission programs'],
    },
    {
      id: 'performance',
      label: '04',
      title: 'Outcome-focused delivery',
      body: 'We align work to defined outcomes, track performance, and surface delivery risk early.',
      tags: ['Defined outcomes', 'Performance tracking', 'Early risk visibility'],
    },
    {
      id: 'partner',
      label: '05',
      title: 'Mission-aligned partnership',
      body: 'We focus on requirement fit and delivery accountability—not simply filling seats.',
      tags: ['Requirement fit', 'Delivery accountability', 'Partner discipline'],
    },
  ] satisfies Differentiator[],
};

export const markets = {
  label: 'Markets we serve',
  headline: 'Built around the mission environment.',
  lede: 'Six service lines supporting national security, intelligence, cyber, facilities, readiness, and logistics.',
  items: [
    {
      id: 'national-security',
      title: 'National Security Technology',
      description: 'Technical and professional support for national-security systems and programs.',
      tags: ['Technical services', 'Program support', 'Mission systems'],
      imageSeed: 'ce-national-security',
    },
    {
      id: 'intelligence',
      title: 'Intelligence Community',
      description: 'Discreet, responsive support for intelligence organizations and mission programs.',
      tags: ['Mission support', 'Operational discretion', 'Responsive delivery'],
      imageSeed: 'ce-intelligence',
    },
    {
      id: 'cyber',
      title: 'Cyber Operations',
      description: 'Technical staffing and delivery support for cyber mission teams.',
      tags: ['Cyber staffing', 'Technical support', 'Program delivery'],
      imageSeed: 'ce-cyber',
    },
    {
      id: 'facilities',
      title: 'Federal Facilities & Infrastructure',
      description: 'Operations, maintenance, and construction for mission-supporting facilities.',
      tags: ['Facility operations', 'Preventive maintenance', 'Construction support'],
      imageSeed: 'ce-facilities',
    },
    {
      id: 'readiness',
      title: 'Training & Readiness',
      description: 'Instruction and courseware that sustain team readiness through turnover.',
      tags: ['Courseware design', 'Instructor delivery', 'Readiness sustainment'],
      imageSeed: 'ce-readiness',
    },
    {
      id: 'logistics',
      title: 'Logistics & Transportation',
      description: 'Planned, accountable movement of people and materiel.',
      tags: ['Personnel movement', 'Materiel movement', 'Schedule alignment'],
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
