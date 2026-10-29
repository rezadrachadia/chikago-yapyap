import { useEffect, useMemo, useState } from 'react';
import { Play, Headphones, Lightbulb, ExternalLink, Radio, Link2Off } from 'lucide-react';
import { apiService, toSpotifyEmbed, SPOTIFY_SHOW_URL } from '../lib/api';
import RequestForm from '../components/RequestForm';

export default function Podcast() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null); // episode yang sedang dimainkan

  useEffect(() => {
    let active = true;
    apiService
      .getPodcasts()
      .then((data) => {
        if (!active) return;
        setEpisodes(data);
        // Default: episode terbaru (nomor paling besar)
        const latest = data.reduce((max, ep) => (ep.no > (max?.no || 0) ? ep : max), null);
        setActiveId(latest ? latest.id : null);
      })
      .catch(() => active && setError('Gagal memuat daftar episode.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const activeEpisode = useMemo(
    () => episodes.find((ep) => ep.id === activeId) || episodes[0] || null,
    [episodes, activeId]
  );

  const playerEmbed = activeEpisode ? toSpotifyEmbed(activeEpisode.spotifyLink) : '';
  const playerOpenUrl = activeEpisode?.spotifyLink || SPOTIFY_SHOW_URL;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-widest text-[#1DB954]">Suara Chikago</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Chikago Podcast
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-slate-700">
          Yah biasalah isinya podcast-podcast kite yang udah up di spotify aje, karena kan kita uploadnya RAJIN dan SERING, jadi kita taro disini dulu aja biar keren dah.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-5">
        {/* ============ PEMUTAR SPOTIFY (Theme Dark & Green Pixel) ============ */}
        <section className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border-2 border-slate-900 bg-zinc-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <p className="inline-flex items-center gap-2 text-sm font-black text-white">
              <Headphones size={18} className="text-[#1DB954]" /> Pemutar Spotify
            </p>

            {activeEpisode && (
              <p className="mt-1 truncate text-xs font-bold text-zinc-400">
                <Radio size={12} className="mr-1 inline text-[#1DB954]" />
                Sedang diputar: Episode {activeEpisode.no}
              </p>
            )}

            <div className="mt-4 overflow-hidden rounded-xl border-2 border-slate-900 bg-black">
              {playerEmbed ? (
                <iframe
                  key={playerEmbed}
                  title={`Pemutar Spotify — ${activeEpisode?.title || 'Chikago Podcast'}`}
                  src={playerEmbed}
                  width="100%"
                  height={activeEpisode?.spotifyLink?.includes('/track/') ? 152 : 352}
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-[152px] flex-col items-center justify-center gap-2 p-4 text-center">
                  <Link2Off size={26} className="text-zinc-600" />
                  <p className="text-xs font-bold text-zinc-400">
                    Link Spotify episode ini belum diisi.
                    <br />
                  </p>
                  <p className="text-[11px] font-medium text-zinc-500">
                    Tambahkan lewat menu “Kelola Podcast” di dashboard admin.
                  </p>
                </div>
              )}
            </div>

            {/* Tombol Utama Spotify (Pixel Style) */}
            <a
              href={playerOpenUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-pixel mt-4 w-full bg-[#1DB954] text-slate-950 px-4 py-2.5 text-xs"
            >
              Buka Langsung di Spotify <ExternalLink size={14} />
            </a>
          </div>
        </section>

        {/* ============ DAFTAR EPISODE + FORM ============ */}
        <section className="space-y-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900">Daftar Episode</h2>
            {!loading && (
              <span className="btn-pixel bg-[#1DB954] text-slate-950 px-3 py-1 text-xs hover:translate-y-0 hover:shadow-[0_6px_0_0_#0f172a]">
                {episodes.length} Episode
              </span>
            )}
          </div>

          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border-2 border-slate-900/30 bg-zinc-900/40 p-4">
                  <div className="h-10 w-10 rounded bg-zinc-800" />
                  <div className="mt-3 h-4 w-2/3 rounded bg-zinc-800" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-zinc-800/60" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-xl border-2 border-rose-500 bg-rose-100 p-5 text-sm font-bold text-rose-900">
              {error}
            </div>
          )}

          {!loading && !error && episodes.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-slate-900 bg-white p-10 text-center text-sm font-bold text-slate-500">
              Belum ada episode. Tambahkan lewat menu “Kelola Podcast” di dashboard admin.
            </div>
          )}

          <ol className="space-y-4">
            {episodes.map((ep) => {
              const isActive = ep.id === activeId;
              return (
                <li
                  key={ep.id}
                  className={`group flex gap-4 rounded-xl border-2 border-slate-900 p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition duration-200 hover:-translate-y-0.5 ${
                    isActive ? 'bg-zinc-800 ring-2 ring-[#1DB954]' : 'bg-zinc-900'
                  }`}
                >
                  {/* Badge Nomor Episode Hijau Pixel */}
                  <span
                    className={`btn-pixel h-10 w-10 shrink-0 p-0 text-sm flex items-center justify-center hover:translate-y-0 hover:shadow-[0_6px_0_0_#0f172a] ${
                      isActive ? 'bg-white text-slate-950' : 'bg-[#1DB954] text-slate-950'
                    }`}
                  >
                    {ep.no}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-extrabold text-white">{ep.title}</p>
                      {ep.duration && (
                        <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] font-bold text-zinc-300">
                          {ep.duration}
                        </span>
                      )}
                      {isActive && (
                        <span className="rounded-md border border-[#1DB954] bg-[#1DB954]/15 px-2 py-0.5 text-[10px] font-black uppercase text-[#1DB954]">
                          Sedang Diputar
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-zinc-400 line-clamp-2">{ep.desc}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {/* Putar langsung di pemutar utama */}
                      <button
                        type="button"
                        onClick={() => setActiveId(ep.id)}
                        disabled={isActive}
                        className="btn-pixel bg-[#1DB954] text-slate-950 px-3 py-1.5 text-xs disabled:opacity-50"
                      >
                        <Play size={12} className="fill-current" />
                        {isActive ? 'Sedang Diputar' : 'Putar di Player'}
                      </button>

                      {/* Buka episode di Spotify */}
                      {ep.spotifyLink && (
                        <a
                          href={ep.spotifyLink}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-pixel bg-white text-slate-950 px-3 py-1.5 text-xs"
                        >
                          <ExternalLink size={12} /> Spotify
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* ============ FORM USULAN TOPIK ============ */}
          <div className="pt-4">
            <div className="rounded-2xl border-2 border-slate-900 bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-white">
              <div className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#1DB954]">
                <Lightbulb size={18} className="text-[#1DB954]" /> Usulan Topik
              </div>
              <RequestForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
