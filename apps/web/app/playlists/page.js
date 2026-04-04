import { PlaylistsDashboard } from '@/components/playlists/playlists-dashboard';

export const metadata = {
  title: 'Playlists',
  description: 'Create and manage saved playlists',
};

export default function PlaylistsPage() {
  return <PlaylistsDashboard />;
}
