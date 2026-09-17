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
  themeColor: '#10283E',
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
 * Opts into motion before first paint so animated targets never flash in their
 * final position. The intro is device-agnostic, session-scoped, and has its own
 * fail-safe so a hydration error can never leave an opaque curtain on screen.
 */
const noFlashScript = `(function(){try{var d=document.documentElement,r=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(r)return;d.classList.add('motion-hero','motion-on');var s=false,f=new URLSearchParams(location.search).get('intro')==='1';try{s=sessionStorage.getItem('ce-entry-seen')==='1';}catch(x){}if(f||!s){d.classList.add('motion-entry');setTimeout(function(){d.classList.remove('motion-entry','motion-hero');},1900);}setTimeout(function(){if(!d.dataset.motionReady)d.classList.remove('motion-entry','motion-hero','motion-on');},3000);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // The no-flash script below adds motion classes before hydration; that diff is intentional.
      suppressHydrationWarning
      className={`${archivo.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <head>
        <link
          rel="preload"
          as="image"
          href={sitePath('/brand/logo-compact-clean.webp')}
          type="image/webp"
          crossOrigin="anonymous"
        />
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="bg-surface-canvas text-foreground-secondary antialiased">{children}</body>
    </html>
  );
}
