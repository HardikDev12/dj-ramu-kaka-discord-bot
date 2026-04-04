import { Poppins, Righteous } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const righteous = Righteous({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'DJ Ramu Kaka',
    template: '%s · DJ Ramu Kaka',
  },
  description: 'Discord music bot with web playlists, voice playback, and Lavalink.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${righteous.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}

