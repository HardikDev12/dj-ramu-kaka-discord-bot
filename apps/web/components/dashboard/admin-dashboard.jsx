'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PageLoader } from '@/components/ui/page-loader';

function serializeTracks(tracks) {
  return (tracks || []).map((t) => ({
    title: (typeof t.title === 'string' ? t.title : '').trim(),
    url: (typeof t.url === 'string' ? t.url : '').trim(),
    duration: Number.isFinite(Number(t.duration)) ? Number(t.duration) : 0,
  }));
}

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalUsers: 0, totalPlaylists: 0, totalTracks: 0 });
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [playlists, setPlaylists] = useState([]);
  const [editing, setEditing] = useState(false);

  async function loadBase() {
    setError('');
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/data/admin/stats', { credentials: 'include' }),
        fetch('/data/admin/users', { credentials: 'include' }),
      ]);
      if (!statsRes.ok || !usersRes.ok) {
        const body = await (statsRes.ok ? usersRes : statsRes).json().catch(() => ({}));
        throw new Error(body?.error?.message || 'Could not load admin dashboard');
      }
      const statsBody = await statsRes.json();
      const usersBody = await usersRes.json();
      setStats(statsBody.stats || { totalUsers: 0, totalPlaylists: 0, totalTracks: 0 });
      const nextUsers = Array.isArray(usersBody.users) ? usersBody.users : [];
      setUsers(nextUsers);
      setSelectedUserId((cur) => cur || nextUsers[0]?.id || '');
    } catch (e) {
      setError(e?.message || 'Could not load admin dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function loadPlaylistsFor(userId) {
    if (!userId) return;
    setError('');
    try {
      const res = await fetch(`/data/admin/users/${encodeURIComponent(userId)}/playlists`, { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || 'Could not load user playlists');
      }
      const body = await res.json();
      setPlaylists(Array.isArray(body.playlists) ? body.playlists : []);
    } catch (e) {
      setError(e?.message || 'Could not load user playlists');
      setPlaylists([]);
    }
  }

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    loadPlaylistsFor(selectedUserId);
  }, [selectedUserId]);

  async function savePlaylist(playlist) {
    setEditing(true);
    setError('');
    try {
      const res = await fetch(`/data/admin/users/${encodeURIComponent(selectedUserId)}/playlists/${playlist._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: playlist.name,
          tracks: serializeTracks(playlist.tracks),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || 'Save failed');
      }
      await loadPlaylistsFor(selectedUserId);
      await loadBase();
    } catch (e) {
      setError(e?.message || 'Save failed');
    } finally {
      setEditing(false);
    }
  }

  if (loading) return <PageLoader label="Loading admin dashboard" />;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#262626] bg-[#131313] p-4">
          <p className="text-xs uppercase tracking-wider text-[#adaaaa]">Users</p>
          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
        </div>
        <div className="rounded-xl border border-[#262626] bg-[#131313] p-4">
          <p className="text-xs uppercase tracking-wider text-[#adaaaa]">Playlists</p>
          <p className="text-3xl font-bold text-white">{stats.totalPlaylists}</p>
        </div>
        <div className="rounded-xl border border-[#262626] bg-[#131313] p-4">
          <p className="text-xs uppercase tracking-wider text-[#adaaaa]">Tracks</p>
          <p className="text-3xl font-bold text-white">{stats.totalTracks}</p>
        </div>
      </section>

      {error ? <p className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">{error}</p> : null}

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#fdd400]">User List</h3>
          <div className="space-y-2">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedUserId(u.id)}
                className={`w-full rounded-xl border p-3 text-left transition-all ${
                  selectedUserId === u.id
                    ? 'border-[#ffa84f]/40 bg-gradient-to-r from-[#ffa84f]/15 to-transparent'
                    : 'border-[#262626] bg-[#131313]'
                }`}
              >
                <p className="truncate font-semibold text-white">{u.name}</p>
                <p className="text-xs text-[#adaaaa]">{u.email || 'discord user'}</p>
                <p className="mt-1 text-xs text-[#767575]">
                  Servers: {u.serverCount} · Playlists: {u.playlistCount} · Tracks: {u.trackCount}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#fdd400]">Modify User Playlists</h3>
          <div className="space-y-3">
            {playlists.map((pl) => (
              <AdminPlaylistEditor key={pl._id} playlist={pl} onSave={savePlaylist} disabled={editing} />
            ))}
            {!playlists.length ? (
              <p className="rounded-xl border border-dashed border-[#262626] bg-[#131313] p-4 text-sm text-[#adaaaa]">No playlists for this user.</p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function AdminPlaylistEditor({ playlist, onSave, disabled }) {
  const [name, setName] = useState(playlist.name || '');
  const [tracks, setTracks] = useState(serializeTracks(playlist.tracks));

  function updateTrack(i, key, value) {
    setTracks((arr) => arr.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)));
  }

  function addTrack() {
    setTracks((arr) => [...arr, { title: 'Track', url: '', duration: 0 }]);
  }

  function removeTrack(i) {
    setTracks((arr) => arr.filter((_, idx) => idx !== i));
  }

  return (
    <div className="rounded-xl border border-[#262626] bg-[#131313] p-4">
      <div className="grid gap-2">
        <Label className="text-[#adaaaa]">Playlist name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="border-[#262626] bg-[#0e0e0e]" />
      </div>

      <div className="mt-3 space-y-2">
        {tracks.map((t, i) => (
          <div key={`${playlist._id}-${i}`} className="grid gap-2 sm:grid-cols-12">
            <Input
              value={t.title}
              onChange={(e) => updateTrack(i, 'title', e.target.value)}
              className="sm:col-span-4 border-[#262626] bg-[#0e0e0e]"
              placeholder="Title"
            />
            <Input
              value={t.url}
              onChange={(e) => updateTrack(i, 'url', e.target.value)}
              className="sm:col-span-6 border-[#262626] bg-[#0e0e0e]"
              placeholder="URL"
            />
            <Button type="button" variant="outline" className="sm:col-span-2 border-[#3a3a3a] " onClick={() => removeTrack(i)}>
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="border-[#3a3a3a]" onClick={addTrack} disabled={disabled}>
          Add Track
        </Button>
        <Button
          type="button"
          variant="gradientOrange"
          disabled={disabled || !name.trim()}
          className="gradient-orange"
          onClick={() => onSave({ ...playlist, name: name.trim(), tracks })}
        >
          Save Playlist
        </Button>
      </div>
    </div>
  );
}
