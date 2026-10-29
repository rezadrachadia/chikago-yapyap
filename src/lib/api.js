/**
 * Service API Chikago Community Hub.
 *
 * - Members, Requests, Login  -> REST API backend Express (/api)
 * - Aktivitas & Episode Podcast -> REST backend (activities.json / podcasts.json);
 *   jika backend tidak terjangkau, otomatis fallback ke localStorage (mode offline)
 * - Upload gambar -> POST multipart ke /api/upload/*
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ==================================================================
 *  REST API sederhana (backend Express)
 * ================================================================== */

export async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error((data && data.message) || `Request gagal (${res.status})`);
  }
  return data;
}

/* ==================================================================
 *  Helper Spotify
 * ================================================================== */

/**
 * Konversi link/URI Spotify apa pun (track, episode, show, album, playlist)
 * menjadi URL embed iframe-nya.
 *
 * Contoh:
 *   https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=xxx
 *     -> https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC?utm_source=generator
 *   spotify:episode:5nO5zx9mCXjTZVraixSyUF
 *     -> https://open.spotify.com/embed/episode/5nO5zx9mCXjTZVraixSyUF?utm_source=generator
 *
 * Mengembalikan string kosong ('') jika bukan link Spotify yang valid.
 */
export function toSpotifyEmbed(url) {
  if (!url) return '';
  const value = String(url).trim();
  if (!value) return '';

  // Spotify URI: spotify:track:xxxx
  const uri = value.match(/^spotify:(track|episode|show|album|playlist|artist):([A-Za-z0-9]+)$/i);
  if (uri) {
    return `https://open.spotify.com/embed/${uri[1].toLowerCase()}/${uri[2]}?utm_source=generator`;
  }

  // Link web: https://open.spotify.com/[locale/]track/xxxx?si=...
  const web = value.match(
    /open\.spotify\.com\/(?:[a-z]{2}\/)?(track|episode|show|album|playlist|artist)\/([A-Za-z0-9]+)/i
  );
  if (web) {
    return `https://open.spotify.com/embed/${web[1].toLowerCase()}/${web[2]}?utm_source=generator`;
  }

  return '';
}

/** True jika string adalah link/URI Spotify yang valid. */
export function isSpotifyUrl(url) {
  return toSpotifyEmbed(url) !== '';
}

/* ==================================================================
 *  Bingkai foto member (adjuster zoom & posisi)
 *  Dipakai Admin (preview), MemberCard, dan MemberModal supaya foto
 *  PNG transparan selalu pas di bingkai: zoom + posisi X/Y%.
 * ================================================================== */

export const FOTO_FRAME_DEFAULTS = { fotoZoom: 1, fotoPosX: 50, fotoPosY: 50 };

const clampNumber = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/**
 * Style CSS untuk render foto member sesuai pengaturan adjuster
 * admin (zoom 1–3, posisi X/Y 0–100%, 50 = tengah).
 *
 * Dipakai untuk foto PNG cutout (object-contain): foto digeser
 * (drag) & di-zoom tanpa memotong badannya. Nilai X/Y dipetakan
 * ke translate relatif (-30%..+30%) dari ukuran elemen.
 */
export function fotoFrameStyle(member = {}) {
  const zoom = clampNumber(member.fotoZoom, 1, 3, FOTO_FRAME_DEFAULTS.fotoZoom);
  const x = clampNumber(member.fotoPosX, 0, 100, FOTO_FRAME_DEFAULTS.fotoPosX);
  const y = clampNumber(member.fotoPosY, 0, 100, FOTO_FRAME_DEFAULTS.fotoPosY);
  return {
    transform: `translate(${(x - 50) * 0.6}%, ${(y - 50) * 0.6}%) scale(${zoom})`,
    transformOrigin: 'center',
  };
}

/** URL halaman show podcast Chikago di Spotify. */
export const SPOTIFY_SHOW_URL = 'https://open.spotify.com/show/3R7IdebXtD8BvIwi8bEdl1';

/* ==================================================================
 *  Mock persisten (localStorage) untuk Aktivitas & Podcast
 * ================================================================== */

const STORAGE_KEYS = {
  activities: 'chikago_activities_v1',
  podcasts: 'chikago_podcasts_v1',
};

/** Data awal — otomatis dipakai saat storage masih kosong. */
const SEED_ACTIVITIES = [
  {
    id: 1,
    title: 'Chikago Futsal',
    category: 'Futsal',
    desc: 'Biasalah foto-foto kite futsal aje isinye, kali nanti bisa futsal di brazil',
    photos: Array.from(
      { length: 8 },
      (_, i) => `/activities/futsal/futsal-${String(i + 1).padStart(2, '0')}.svg`
    ),
  },
  {
    id: 2,
    title: 'Chikago Minsoc Vol.1',
    category: 'Mini-Soccer',
    desc: 'Karena kita ga nyewa FG, jadinya foto minsoc vol.1 kita begini guys',
    photos: Array.from(
      { length: 8 },
      (_, i) => `/activities/minisoccer/soccer-${String(i + 1).padStart(2, '0')}.svg`
    ),
  },
];

const SEED_PODCASTS = [
  {
    id: 1,
    no: 1,
    title: 'Episode 1 - Top 5 Sungai yang Banyak Ibu-Ibu mandi',
    duration: '1 Jam 10 Menit',
    desc: 'Mulainya di 00:41 Ges.. (Maap editor newbie) Aan menemukan sesuatu yang aneh di Labuan Bajo! Bukan cuma soal Komodo dan pemandangan indah, tapi juga kejadian misterius yang bikin merinding. Apa yang sebenarnya terjadi? Dengerin episode ini untuk mengungkap misteri Labuan Bajo!',
    spotifyLink: 'https://open.spotify.com/episode/2tr9h5q7SnYcv0KAhZL5fv',
  },
  {
    id: 2,
    no: 2,
    title: 'Episode 2 - DJ Ayam dan Petualangan Reza di Bandung',
    duration: '45 Menit',
    desc: 'Patut kita saksikan kisah Reza Dwi Ardhito di Bandung di weekend mendatang, akankah Bandung menjadi daerah indah penuh kenangan atau justru menjadi momok menakutkan?',
    spotifyLink: 'https://open.spotify.com/episode/2p5pgLgo1X2DKhDVMCyhLg',
  },
  {
    id: 3,
    no: 3,
    title: 'Episode 3 - Ibnu Sang Englishman.',
    duration: '36 Menit',
    desc: 'Episode kali ini agak berbobot, tapi tetep aja isinya orang stress. Episode kali ini kita kedatangan tamu yang lidahnya udah kejepit kamus Oxford: Ibnu Sang Englishman.',
    spotifyLink: 'https://open.spotify.com/episode/5nO5zx9mCXjTZVraixSyUF',
  },
];

const clone = (data) => JSON.parse(JSON.stringify(data));

/** Baca storage; jika kosong, tulis seed lebih dulu. */
function readStore(key, seed) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seed));
      return clone(seed);
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : clone(seed);
  } catch {
    // localStorage tidak tersedia (mis. privacy mode) -> pakai seed di memori
    return clone(seed);
  }
}

function writeStore(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    /* diabaikan: data tetap hidup di state React selama halaman terbuka */
  }
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

/** Normalisasi payload aktivitas dari form admin. */
function normalizeActivity(payload = {}) {
  const photos = Array.isArray(payload.photos)
    ? payload.photos
    : String(payload.photos || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
  return {
    title: String(payload.title || '').trim(),
    category: String(payload.category || '').trim() || 'Lainnya',
    desc: String(payload.desc || '').trim(),
    photos,
  };
}

/** Normalisasi payload episode podcast dari form admin. */
function normalizePodcast(payload = {}) {
  return {
    no: Number(payload.no) || 0,
    title: String(payload.title || '').trim(),
    duration: String(payload.duration || '').trim(),
    desc: String(payload.desc || '').trim(),
    spotifyLink: String(payload.spotifyLink || '').trim(),
  };
}

/* ==================================================================
 *  Service
 * ================================================================== */

export const apiService = {
  /* ---------- Members (REST backend) ---------- */
  getMembers: async () => { try { const d = await api('/members'); return Array.isArray(d)?d:[]; } catch(e){ throw e; } },
  addMember: (member) => api('/members', { method: 'POST', body: JSON.stringify(member) }),
  updateMember: (id, member) => api(`/members/${id}`, { method: 'PUT', body: JSON.stringify(member) }),
  deleteMember: (id) => api(`/members/${id}`, { method: 'DELETE' }),

  /* ---------- Login admin (REST backend) ---------- */
  login: (password) => api('/login', { method: 'POST', body: JSON.stringify({ password }) }),

  /* ---------- Requests topik (REST backend) ---------- */
  sendRequest: (payload) => api('/request-topik', { method: 'POST', body: JSON.stringify(payload) }),
  getRequests: () => api('/requests'),
  setRequestStatus: (id, status) =>
    api(`/requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteRequest: (id) => api(`/requests/${id}`, { method: 'DELETE' }),

  /* ---------- Aktivitas (REST backend, fallback localStorage) ----------
   * Jika backend hidup -> tersimpan di backend (activities.json) sehingga
   * perubahan admin terlihat di semua perangkat. Jika backend mati ->
   * otomatis jatuh ke localStorage (mode offline).
   */
  getActivities: async () => {
    try {
      const data = await api('/activities');
      writeStore(STORAGE_KEYS.activities, data); // cache lokal untuk mode offline
      return data;
    } catch {
      return readStore(STORAGE_KEYS.activities, SEED_ACTIVITIES);
    }
  },

  addActivity: async (payload) => {
    const body = normalizeActivity(payload);
    try {
      const created = await api('/activities', { method: 'POST', body: JSON.stringify(body) });
      await apiService.getActivities(); // sinkronkan cache lokal
      return created;
    } catch {
      // Fallback offline: localStorage
      const items = readStore(STORAGE_KEYS.activities, SEED_ACTIVITIES);
      const activity = {
        id: nextId(items),
        ...body,
        createdAt: new Date().toISOString(),
      };
      items.push(activity);
      writeStore(STORAGE_KEYS.activities, items);
      return activity;
    }
  },

  updateActivity: async (id, payload) => {
    const body = normalizeActivity(payload);
    try {
      const updated = await api(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      await apiService.getActivities();
      return updated;
    } catch (err) {
      if (/tidak ditemukan/i.test(err.message)) throw err; // jangan sembunyikan 404
      const items = readStore(STORAGE_KEYS.activities, SEED_ACTIVITIES);
      const index = items.findIndex((item) => item.id === Number(id));
      if (index === -1) throw new Error('Aktivitas tidak ditemukan');
      items[index] = { ...items[index], ...body };
      writeStore(STORAGE_KEYS.activities, items);
      return items[index];
    }
  },

  deleteActivity: async (id) => {
    try {
      const removed = await api(`/activities/${id}`, { method: 'DELETE' });
      await apiService.getActivities();
      return removed.removed || removed;
    } catch (err) {
      if (/tidak ditemukan/i.test(err.message)) throw err;
      const items = readStore(STORAGE_KEYS.activities, SEED_ACTIVITIES);
      const index = items.findIndex((item) => item.id === Number(id));
      if (index === -1) throw new Error('Aktivitas tidak ditemukan');
      const [removed] = items.splice(index, 1);
      writeStore(STORAGE_KEYS.activities, items);
      return removed;
    }
  },

  /* ---------- Episode Podcast (REST backend, fallback localStorage) ---------- */
  getPodcasts: async () => {
    try {
      const data = await api('/podcasts');
      writeStore(STORAGE_KEYS.podcasts, data);
      return data;
    } catch {
      return readStore(STORAGE_KEYS.podcasts, SEED_PODCASTS).sort((a, b) => a.no - b.no);
    }
  },

  addPodcast: async (payload) => {
    const body = normalizePodcast(payload);
    try {
      const created = await api('/podcasts', { method: 'POST', body: JSON.stringify(body) });
      await apiService.getPodcasts();
      return created;
    } catch {
      const items = readStore(STORAGE_KEYS.podcasts, SEED_PODCASTS);
      const episode = { id: nextId(items), ...body };
      if (!episode.no) episode.no = items.reduce((max, e) => Math.max(max, e.no || 0), 0) + 1;
      items.push(episode);
      writeStore(STORAGE_KEYS.podcasts, items);
      return episode;
    }
  },

  updatePodcast: async (id, payload) => {
    const body = normalizePodcast(payload);
    try {
      const updated = await api(`/podcasts/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      await apiService.getPodcasts();
      return updated;
    } catch (err) {
      if (/tidak ditemukan/i.test(err.message)) throw err;
      const items = readStore(STORAGE_KEYS.podcasts, SEED_PODCASTS);
      const index = items.findIndex((item) => item.id === Number(id));
      if (index === -1) throw new Error('Episode tidak ditemukan');
      items[index] = { ...items[index], ...body };
      writeStore(STORAGE_KEYS.podcasts, items);
      return items[index];
    }
  },

  deletePodcast: async (id) => {
    try {
      const removed = await api(`/podcasts/${id}`, { method: 'DELETE' });
      await apiService.getPodcasts();
      return removed.removed || removed;
    } catch (err) {
      if (/tidak ditemukan/i.test(err.message)) throw err;
      const items = readStore(STORAGE_KEYS.podcasts, SEED_PODCASTS);
      const index = items.findIndex((item) => item.id === Number(id));
      if (index === -1) throw new Error('Episode tidak ditemukan');
      const [removed] = items.splice(index, 1);
      writeStore(STORAGE_KEYS.podcasts, items);
      return removed;
    }
  },
};

/* ==================================================================
 *  Upload file gambar (multipart/form-data)
 * ================================================================== */

/** POST multipart ke endpoint upload backend. */
async function upload(pathname, formData) {
  const res = await fetch(`${API_BASE}${pathname}`, { method: 'POST', body: formData });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new Error((data && data.message) || `Upload gagal (${res.status})`);
  }
  return data;
}

export const uploadService = {
  /**
   * Upload multi foto aktivitas.
   * @returns {Promise<{ urls: string[], files: Array<{filename: string, size: number, url: string}> }>}
   */
  uploadActivityPhotos: (files) => {
    const fd = new FormData();
    Array.from(files).forEach((file) => fd.append('photos', file));
    return upload('/upload/activities', fd);
  },

  /**
   * Upload satu foto profil member.
   * @returns {Promise<{ url: string, filename: string, size: number }>}
   */
  uploadMemberPhoto: (file) => {
    const fd = new FormData();
    fd.append('foto', file);
    return upload('/upload/members', fd);
  },
};
