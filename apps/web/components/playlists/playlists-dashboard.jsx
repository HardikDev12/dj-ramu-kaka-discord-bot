'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** API expects plain { title, url, duration }[] */
function serializeTracks(tracks) {
  return (tracks || []).map((t) => ({
    title: (typeof t.title === 'string' ? t.title : '').trim() || 'Track',
    url: (typeof t.url === 'string' ? t.url : '').trim(),
    duration:
      typeof t.duration === 'number' && Number.isFinite(t.duration) && t.duration >= 0 ? t.duration : 0,
  }));
}

function fallbackTitleFromUrl(url) {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes('youtube.com') || u.hostname === 'youtu.be') return 'YouTube track';
    if (u.hostname.includes('soundcloud.com')) return 'SoundCloud track';
    return u.hostname.replace(/^www\./, '') || 'Track';
  } catch {
    return 'Track';
  }
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function PlaylistsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyTrackEdit, setBusyTrackEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [trackUrl, setTrackUrl] = useState('');
  const [trackTitle, setTrackTitle] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError('');
      if (reloadKey === 0) setLoading(true);

      const me = await fetch('/auth/me', { credentials: 'include' });
      if (!me.ok) {
        router.push('/login?next=/playlists');
        return;
      }
      const { user: u } = await me.json();
      if (!cancelled) setUser(u);

      const pl = await fetch('/data/playlists', { credentials: 'include' });
      if (!pl.ok) {
        const body = await pl.json().catch(() => ({}));
        if (!cancelled) {
          setError(body?.error?.message || 'Could not load playlists (is MONGO_URI set on the API?)');
          setPlaylists([]);
        }
      } else {
        const data = await pl.json();
        const nextPlaylists = data.playlists || [];
        if (!cancelled) {
          setPlaylists(nextPlaylists);
          setSelectedId((current) => {
            if (current && nextPlaylists.some((p) => p._id === current)) return current;
            return nextPlaylists[0]?._id || null;
          });
        }
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, router]);

  async function onCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/data/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Create failed');
        return;
      }
      setName('');
      setReloadKey((v) => v + 1);
    } catch {
      setError('Network error');
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(id) {
    const result = await Swal.fire({
      title: 'Delete this playlist?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      background: '#1a1919',
      color: '#ffffff',
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: '#3f3f46',
    });
    if (!result.isConfirmed) return;
    setError('');
    const res = await fetch(`/data/playlists/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error?.message || 'Delete failed');
      return;
    }
    await Swal.fire({
      title: 'Deleted',
      text: 'Playlist removed successfully.',
      icon: 'success',
      timer: 1300,
      showConfirmButton: false,
      background: '#1a1919',
      color: '#ffffff',
    });
    setReloadKey((v) => v + 1);
  }

  async function patchTracks(playlistId, nextTracks) {
    setBusyTrackEdit(true);
    setError('');
    try {
      const res = await fetch(`/data/playlists/${playlistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tracks: nextTracks }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Could not update playlist');
        return false;
      }
      setReloadKey((v) => v + 1);
      return true;
    } catch {
      setError('Network error');
      return false;
    } finally {
      setBusyTrackEdit(false);
    }
  }

  async function onAddTrack(e) {
    e.preventDefault();
    if (!selectedId) return;
    const selectedPlaylist = playlists.find((p) => p._id === selectedId);
    if (!selectedPlaylist) return;
    const url = trackUrl.trim();
    if (!url) return;
    const title = trackTitle.trim() || fallbackTitleFromUrl(url);
    const existing = serializeTracks(selectedPlaylist.tracks).filter((t) => t.url);
    const success = await patchTracks(selectedId, [...existing, { title, url, duration: 0 }]);
    if (success) {
      setTrackUrl('');
      setTrackTitle('');
    }
  }

  async function onRemoveTrack(index) {
    if (!selectedId) return;
    const selectedPlaylist = playlists.find((p) => p._id === selectedId);
    if (!selectedPlaylist) return;
    const existing = serializeTracks(selectedPlaylist.tracks).filter((t) => t.url);
    const nextTracks = existing.filter((_, i) => i !== index);
    await patchTracks(selectedId, nextTracks);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const selectedPlaylist = playlists.find((p) => p._id === selectedId) || null;
  const selectedTracks = selectedPlaylist ? serializeTracks(selectedPlaylist.tracks).filter((t) => t.url) : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="mb-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">Playlist Configuration</h2>
          <p className="mt-1 text-sm text-[#adaaaa]">Manage your high-octane sets for DJ Ramu Kaka.</p>
        </div>
      </header>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <section className="col-span-12 space-y-3 lg:col-span-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#fdd400]">Your Collections</h3>
          <form onSubmit={onCreate} className="rounded-xl border border-[#262626] bg-[#131313] p-4">
            <Label htmlFor="pl-name" className="text-xs uppercase tracking-wider text-[#adaaaa]">
              Create playlist
            </Label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                id="pl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Late Night Vibes"
                maxLength={100}
                className="border-[#262626] bg-[#0e0e0e] text-white placeholder:text-[#767575]"
              />
              <Button
                type="submit"
                disabled={creating || !name.trim()}
                className="w-full bg-gradient-to-r from-[#ffa84f] to-[#fe9400] font-semibold text-[#231000] hover:opacity-90 sm:w-auto"
              >
                {creating ? '...' : 'Add'}
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            {playlists.map((p) => {
              const isActive = p._id === selectedId;
              const count = serializeTracks(p.tracks).filter((t) => t.url).length;
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => setSelectedId(p._id)}
                  className={cn(
                    'w-full rounded-xl border p-4 text-left transition-all',
                    isActive
                      ? 'border-[#ffa84f]/40 bg-gradient-to-r from-[#ffa84f]/15 to-transparent'
                      : 'border-[#262626] bg-[#131313] hover:border-[#3a3a3a] hover:bg-[#1a1919]'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={cn('truncate font-display text-lg font-bold', isActive ? 'text-white' : 'text-[#d1d1d1]')}>{p.name}</p>
                      <p className="text-xs text-[#767575]">{count} tracks</p>
                    </div>
                    <span className={cn('text-xs font-bold', isActive ? 'text-[#ffa84f]' : 'text-[#adaaaa]')}>#{count}</span>
                  </div>
                </button>
              );
            })}
            {!playlists.length ? (
              <p className="rounded-xl border border-dashed border-[#262626] bg-[#131313] p-4 text-sm text-[#adaaaa]">
                No playlists yet. Create one to start adding tracks.
              </p>
            ) : null}
          </div>
        </section>

        <section className="col-span-12 overflow-hidden rounded-2xl border border-[#262626] bg-[#1a1919] lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262626] p-5">
            <div>
              <h3 className="font-display text-2xl font-bold text-white">{selectedPlaylist?.name || 'Select a playlist'}</h3>
              <p className="text-xs text-[#adaaaa]">
                {selectedPlaylist
                  ? `${selectedTracks.length} tracks · Owner ${user.username || user.email || user.id}`
                  : 'Choose a playlist from the left panel'}
              </p>
            </div>
            {selectedPlaylist ? (
              <Button type="button" variant="destructive" onClick={() => onDelete(selectedPlaylist._id)}>
                Delete playlist
              </Button>
            ) : null}
          </div>

          <div className="space-y-4 p-5">
            {selectedPlaylist ? (
              <>
                <form onSubmit={onAddTrack} className="grid gap-3 rounded-xl border border-[#262626] bg-[#131313] p-4 md:grid-cols-5">
                  <div className="md:col-span-3">
                    <Label htmlFor="track-url" className="text-xs uppercase tracking-wider text-[#adaaaa]">
                      URL or search
                    </Label>
                    <Input
                      id="track-url"
                      value={trackUrl}
                      onChange={(e) => setTrackUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      autoComplete="off"
                      className="mt-1 border-[#262626] bg-[#0e0e0e] text-white placeholder:text-[#767575]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="track-title" className="text-xs uppercase tracking-wider text-[#adaaaa]">
                      Title (optional)
                    </Label>
                    <Input
                      id="track-title"
                      value={trackTitle}
                      onChange={(e) => setTrackTitle(e.target.value)}
                      placeholder="Midnight Drive"
                      maxLength={200}
                      className="mt-1 border-[#262626] bg-[#0e0e0e] text-white placeholder:text-[#767575]"
                    />
                  </div>
                  <div className="md:col-span-5">
                    <Button
                      type="submit"
                      disabled={busyTrackEdit || !trackUrl.trim()}
                      className="w-full bg-gradient-to-r from-[#ffa84f] to-[#fe9400] font-semibold text-[#231000] hover:opacity-90 sm:w-auto"
                    >
                      {busyTrackEdit ? 'Saving...' : 'Add Track'}
                    </Button>
                  </div>
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-y-2 text-sm">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-widest text-[#767575]">
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Title</th>
                        <th className="px-3 py-2 text-right">Duration</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTracks.map((track, i) => (
                        <tr key={`${track.url}-${i}`} className="rounded-xl bg-[#131313]">
                          <td className="rounded-l-xl px-3 py-3 font-display text-[#767575]">{String(i + 1).padStart(2, '0')}</td>
                          <td className="px-3 py-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-white">{track.title}</p>
                              {track.url.startsWith('http') ? (
                                <a
                                  href={track.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#adaaaa] underline underline-offset-2"
                                >
                                  open source
                                </a>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-[#767575]">{formatDuration(track.duration)}</td>
                          <td className="rounded-r-xl px-3 py-3 text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-[#3a3a3a] bg-transparent text-[#d6d6d6] hover:bg-[#2a2a2a]"
                              disabled={busyTrackEdit}
                              onClick={() => onRemoveTrack(i)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!selectedTracks.length ? <p className="text-sm text-[#adaaaa]">No tracks in this playlist yet.</p> : null}
               
              </>
            ) : (
              <p className="text-sm text-[#adaaaa]">Select or create a playlist to configure tracks.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
