const { LoadType } = require('shoukaku');

/** @typedef {{ encoded: string; title: string; author?: string; uri?: string }} QueuedTrack */

function lavalinkResolveQuery(query) {
  const q = query.trim();
  if (!q) return q;
  if (/^https?:\/\//i.test(q)) return q;
  if (/^(?:ytsearch|ytmsearch|scsearch|spsearch|amsearch|dzsearch|ymsearch|msearch):/i.test(q)) return q;
  return `ytsearch:${q}`;
}

/**
 * @param {import('shoukaku').Rest} rest
 * @param {string} searchQuery
 * @returns {Promise<QueuedTrack[] | null>}
 */
async function loadSearchTracks(rest, searchQuery) {
  const doFetch = rest.fetch.bind(rest);
  try {
    const data = await doFetch({
      endpoint: '/loadsearch',
      options: {
        params: {
          query: searchQuery,
          types: 'track',
        },
      },
    });
    if (!data?.tracks?.length) return null;
    return data.tracks.map((t) => {
      const info = t.info || {};
      return {
        encoded: t.encoded,
        title: info.title || 'Unknown track',
        author: info.author || '',
        uri: typeof info.uri === 'string' && info.uri ? info.uri : undefined,
      };
    });
  } catch {
    return null;
  }
}

/**
 * @param {QueuedTrack[]} tracks
 * @returns {import('shoukaku').LavalinkResponse}
 */
function lavalinkResponseFromTrackList(tracks) {
  return {
    loadType: LoadType.SEARCH,
    data: tracks.map((qt) => ({
      encoded: qt.encoded,
      info: {
        title: qt.title,
        author: qt.author || '',
        ...(qt.uri ? { uri: qt.uri } : {}),
      },
    })),
  };
}

/**
 * @param {import('shoukaku').Track} t
 * @returns {QueuedTrack}
 */
function queuedFromLavalinkTrack(t) {
  const info = t.info || {};
  return {
    encoded: t.encoded,
    title: info.title || 'Unknown track',
    author: info.author || '',
    uri: typeof info.uri === 'string' && info.uri ? info.uri : undefined,
  };
}

/**
 * @param {import('shoukaku').LavalinkResponse} res
 * @returns {QueuedTrack[] | null}
 */
function tracksFromSearchResults(res) {
  if (!res || res.loadType !== LoadType.SEARCH || !Array.isArray(res.data)) return null;
  return res.data.map(queuedFromLavalinkTrack);
}

/**
 * @param {import('shoukaku').LavalinkResponse | undefined} res
 */
function firstTrackFromResolve(res) {
  if (!res) return null;
  if (res.loadType === LoadType.ERROR) {
    throw new Error(res.data?.message || 'Lavalink error');
  }
  if (res.loadType === LoadType.EMPTY) return null;
  /** @param {import('shoukaku').Track | undefined} t */
  const from = (t) => {
    if (!t?.encoded) return null;
    const info = t.info || {};
    return {
      encoded: t.encoded,
      title: info.title || 'Unknown track',
      uri: typeof info.uri === 'string' && info.uri ? info.uri : undefined,
    };
  };
  if (res.loadType === LoadType.TRACK) return from(res.data);
  if (res.loadType === LoadType.SEARCH) return from(res.data[0]);
  if (res.loadType === LoadType.PLAYLIST) return from(res.data.tracks[0]);
  return null;
}

/**
 * @param {import('shoukaku').Rest} rest
 * @param {QueuedTrack} track
 */
async function resolvePlayableEncoded(rest, track) {
  const uri = track.uri?.trim();
  if (uri && /^https?:\/\//i.test(uri)) {
    try {
      const res = await rest.resolve(uri);
      if (res && res.loadType !== LoadType.ERROR && res.loadType !== LoadType.EMPTY) {
        const t = firstTrackFromResolve(res);
        if (t?.encoded) return t;
      }
    } catch (e) {
      console.warn('[resolvePlayableEncoded] uri resolve failed, using stored encoding:', e?.message || e);
    }
  }
  if (!track.encoded) throw new Error('No playable track');
  return { encoded: track.encoded, title: track.title, uri: track.uri };
}

/**
 * @param {import('shoukaku').Rest} rest
 * @param {string} query
 * @returns {Promise<{ kind: 'empty' } | { kind: 'error'; message: string } | { kind: 'pick'; tracks: QueuedTrack[] } | { kind: 'single'; track: QueuedTrack }>}
 */
async function resolveQueryToOutcome(rest, query) {
  const resolvedQuery = lavalinkResolveQuery(query);
  const isDirectUrl = /^https?:\/\//i.test(query.trim());
  let res;
  if (!isDirectUrl) {
    const fromSearch = await loadSearchTracks(rest, resolvedQuery);
    if (fromSearch?.length) {
      res = lavalinkResponseFromTrackList(fromSearch);
    }
  }
  if (!res) {
    res = await rest.resolve(resolvedQuery);
  }
  if (res?.loadType === LoadType.ERROR) {
    return { kind: 'error', message: res.data?.message || 'Lavalink error' };
  }
  if (res?.loadType === LoadType.EMPTY) {
    return { kind: 'empty' };
  }
  if (res.loadType === LoadType.SEARCH && res.data.length >= 2) {
    const tracks = tracksFromSearchResults(res);
    if (!tracks?.length) return { kind: 'empty' };
    return { kind: 'pick', tracks };
  }
  const track = firstTrackFromResolve(res);
  if (!track) return { kind: 'empty' };
  return { kind: 'single', track };
}

/**
 * Build { title, url, duration } for Mongo playlist schema.
 * @param {import('shoukaku').Rest} rest
 * @param {QueuedTrack} queued
 */
async function queuedTrackToPlaylistEntry(rest, queued) {
  const playable = await resolvePlayableEncoded(rest, queued);
  const decoded = await rest.decode(playable.encoded);
  const info = decoded?.info || {};
  const url = (typeof info.uri === 'string' && info.uri) || playable.uri || '';
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error('Could not determine a stable URL for this track — paste a direct link.');
  }
  return {
    title: (typeof info.title === 'string' && info.title) || playable.title || 'Unknown track',
    url,
    duration: typeof info.length === 'number' && Number.isFinite(info.length) ? info.length : 0,
  };
}

/**
 * @param {import('shoukaku').Rest} rest
 * @param {string} url
 * @returns {Promise<QueuedTrack | null>}
 */
async function urlToQueuedTrack(rest, url) {
  const res = await rest.resolve(url.trim());
  if (!res || res.loadType === LoadType.ERROR || res.loadType === LoadType.EMPTY) return null;
  const t = firstTrackFromResolve(res);
  if (!t) return null;
  const playable = await resolvePlayableEncoded(rest, t);
  return {
    encoded: playable.encoded,
    title: playable.title,
    author: '',
    uri: playable.uri,
  };
}

module.exports = {
  LoadType,
  lavalinkResolveQuery,
  loadSearchTracks,
  lavalinkResponseFromTrackList,
  queuedFromLavalinkTrack,
  tracksFromSearchResults,
  firstTrackFromResolve,
  resolvePlayableEncoded,
  resolveQueryToOutcome,
  queuedTrackToPlaylistEntry,
  urlToQueuedTrack,
};
