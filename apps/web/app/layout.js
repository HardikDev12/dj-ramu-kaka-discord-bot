export const metadata = {
  title: 'Music bot dashboard',
  description: 'Playlist and admin UI (Phase 4)',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: '2rem' }}>{children}</body>
    </html>
  );
}
