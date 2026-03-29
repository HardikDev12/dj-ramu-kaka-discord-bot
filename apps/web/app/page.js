import Link from 'next/link';

export default function Home() {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return (
    <main>
      <nav style={{ marginBottom: '1.5rem' }}>
        <Link href="/add-bot" style={{ fontWeight: 600 }}>
          Add bot to server (web)
        </Link>
      </nav>
      <h1>Music bot dashboard</h1>
      <p>
        API base: <code>{api}</code>
      </p>
      <p>
        Use <Link href="/add-bot">Add bot to server</Link> to invite the bot from the browser (no
        terminal). Playlist login and OAuth still land in Phase 4.
      </p>
    </main>
  );
}
