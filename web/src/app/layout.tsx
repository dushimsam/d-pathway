import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { QueryProvider } from '@/components/QueryProvider';
import './globals.css';

// Self-hosted so production builds never depend on fetching Google Fonts.
const ibmPlex = localFont({
  variable: '--font-ibm-plex',
  display: 'swap',
  src: [
    { path: './fonts/ibm-plex-sans-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-sans-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/ibm-plex-sans-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/ibm-plex-sans-700.woff2', weight: '700', style: 'normal' },
  ],
});

// Geometric display face for headings on the public surface.
const spaceGrotesk = localFont({
  variable: '--font-space',
  display: 'swap',
  src: [
    { path: './fonts/space-grotesk-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/space-grotesk-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/space-grotesk-700.woff2', weight: '700', style: 'normal' },
  ],
});

const ibmPlexMono = localFont({
  variable: '--font-ibm-plex-mono',
  display: 'swap',
  src: [
    { path: './fonts/ibm-plex-mono-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-mono-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/ibm-plex-mono-600.woff2', weight: '600', style: 'normal' },
  ],
});

export const metadata: Metadata = {
  title: 'D-Pathway — Kigali Graduate Labour Market Platform',
  description:
    'Bounded enterprise projects, immutable evaluations, and direct career pathways for Kigali graduates.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${ibmPlex.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        {/* Marks JS as available before paint so scroll-reveal hidden states
            only apply when they can actually animate (no-JS = fully visible). */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
      </head>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
