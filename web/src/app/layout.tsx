import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import { QueryProvider } from '@/components/QueryProvider';
import './globals.css';

const ibmPlex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'D-Pathway',
  description:
    'Company-posted project platform for the Kigali graduate labour market.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={ibmPlex.variable}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
