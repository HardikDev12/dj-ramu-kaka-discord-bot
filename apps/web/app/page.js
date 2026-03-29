export default function Home() {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return (
    <main>
      <h1>Music bot dashboard</h1>
      <p>
        API base: <code>{api}</code>
      </p>
      <p>Discord OAuth and playlist UI ship in Phase 4 — see <code>.planning/ROADMAP.md</code>.</p>
    </main>
  );
}
