import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';

import { company } from '@/content/site';
import { sitePath } from '@/lib/site-path';
import './globals.css';

/**
 * Fonts are vendored into src/fonts from the @fontsource packages rather than
 * fetched from Google at build time. Keeps builds deterministic, works behind a
 * TLS-inspecting corporate proxy, and avoids a third-party request at runtime.
 */
const archivo = localFont({
  src: [{ path: '../fonts/archivo-latin-wght-normal.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-archivo',
  display: 'swap',
  preload: true,
  fallback: ['Arial', 'Helvetica', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

const inter = localFont({
  src: [{ path: '../fonts/inter-latin-wght-normal.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['Arial', 'Helvetica', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

const plexMono = localFont({
  src: [
    { path: '../fonts/ibm-plex-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/ibm-plex-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-plex-mono',
  display: 'swap',
  preload: true,
  fallback: ['ui-monospace', 'SFMono-Regular', 'monospace'],
  adjustFontFallback: false,
});

const description =
  'CE Solution Plus is a Veteran & Woman-Owned Small Business delivering staffing, facility operations and maintenance, training, professional, construction, and transportation services to national security, intelligence, and cyber programs.';

export const metadata: Metadata = {
  metadataBase: new URL(company.url),
  title: {
    default: 'CE Solution Plus — Veteran & Woman-Owned Small Business',
    template: '%s | CE Solution Plus',
  },
  description,
  keywords: [
    'VOSB',
    'WOSB',
    'veteran owned small business',
    'woman owned small business',
    'government contractor',
    'national security',
    'intelligence community support',
    'cyber staffing',
    'facility operations and maintenance',
    'federal contracting',
  ],
  applicationName: company.name,
  authors: [{ name: company.name }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: company.url,
    siteName: company.name,
    title: 'CE Solution Plus — Mission support, held to standard.',
    description,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CE Solution Plus — Mission support, held to standard.',
    description,
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: sitePath('/brand/icon-32.png'), sizes: '32x32', type: 'image/png' },
      { url: sitePath('/brand/icon-512.png'), sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: sitePath('/brand/icon-180.png'), sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#060b18',
  colorScheme: 'dark',
};

// Structured data helps procurement staff and search engines resolve the entity.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: company.name,
  url: company.url,
  description,
  email: company.email,
  telephone: company.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: company.address.street,
    addressLocality: company.address.city,
    addressRegion: company.address.state,
    postalCode: company.address.zip,
    addressCountry: 'US',
  },
  areaServed: 'US',
  knowsAbout: [
    'Staffing Services',
    'Facility Operations and Maintenance',
    'Training Services',
    'Professional Services',
    'Construction Services',
    'Transportation Services',
  ],
};

/**
 * Adds `motion-on` before first paint so scroll-reveal targets can start hidden
 * without a flash. Users with reduced-motion preferences, or with JS disabled,
 * never get the class — so the server-rendered content stays visible.
 */
const noFlashScript = `(function(){try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('motion-on');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // The no-flash script below adds `motion-on` before hydration; that diff is intentional.
      suppressHydrationWarning
      className={`${archivo.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="bg-ink-950 text-steel-200 antialiased">{children}</body>
    </html>
  );
}
