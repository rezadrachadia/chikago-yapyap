import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiService, toSpotifyEmbed } from '../lib/api';
import MemberCard from '../components/MemberCard';
import MemberModal from '../components/MemberModal';
import FaceStickerBackground from '../components/FaceStickerBackground';
import Reveal from '../components/Reveal';

/**
 * Halaman utama — urutan section:
 * 1) Hero  2) Member (#anggota)  3) Podcast  4) Chikago Beat  5) Footer (#footer, global di App)
 */
export default function Home() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [latestEpisode, setLatestEpisode] = useState(null);

  useEffect(() => {
    let active = true;
    apiService
      .getMembers()
      .then((data) => {
        if (!active) return;
        setMembers(Array.isArray(data) ? data : []);
      })
      .catch(() => active && setError('Gagal memuat data anggota. Pastikan backend berjalan.'))
      .finally(() => active && setLoading(false));

    // Episode podcast terbaru
    apiService
      .getPodcasts()
      .then((eps) => {
        if (!active) return;
        const list = Array.isArray(eps) ? eps : [];
        setLatestEpisode(list.length ? list[list.length - 1] : null);
      })
      .catch(() => active && setLatestEpisode(null));

    return () => {
      active = false;
    };
  }, []);

  const latestEmbed = latestEpisode ? toSpotifyEmbed(latestEpisode.spotifyLink) : '';

  return (
    <div>
      {/* ============ 1) HERO SECTION WITH BACKGROUND WALLPAPER ============ */}
      <section className="relative min-h-[85vh] overflow-hidden border-b-4 border-slate-900 pt-16 pb-20 text-white sm:pt-24 sm:pb-28">
        {/* Background Foto + Dark Overlay Gradient */}
        <div className="absolute inset-0 -z-10">
          <img
            src="/hero-bg.jpg"
            alt="Chikago Team Wallpaper"
            className="h-full w-full object-cover object-center brightness-75 contrast-105 filter"
          />
          {/* Overlay Supaya Teks & Tombol Tetep Kontras & Aesthetic */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/50" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-left">
            {/* Judul Chikago */}
            <Reveal animation="fade-up" delay={0}>
              <h1 className="mb-6 text-5xl font-mukadimah leading-none text-brand-pink drop-shadow-[0_6px_16px_rgba(0,0,0,0.9)] xs:text-6xl sm:text-[7rem] md:text-[9.5rem]">
                Chikago
              </h1>
            </Reveal>

            {/* Deskripsi Teks Terang */}
            <Reveal animation="fade-up" delay={150}>
              <p className="mt-10 max-w-2xl text-base font-medium leading-relaxed text-slate-100 sm:mt-14 sm:text-lg sm:leading-loose md:mt-20">
                Kami percaya bahwa hidup ini terlalu singkat untuk ditanggapi dengan serius. Kami
                membahas segala hal, mulai dari konspirasi kulkas sampai filosofi di balik kentut.
                Bersiaplah untuk perjalanan yang liar, aneh, dan dijamin bikin kamu mikir (ga juga
                sih).
              </p>
            </Reveal>

            {/* Tombol Aksi Pixel Retro */}
            <Reveal animation="fade-up" delay={300}>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href="#anggota"
                  className="btn-pixel bg-brand-pink px-6 py-3 text-base text-slate-900 sm:px-8 sm:py-3.5 sm:text-lg"
                >
                  Kenalan sama member{' '}
                  <ArrowRight size={20} className="ml-1 stroke-[3]" />
                </a>
                <Link
                  to="/podcast"
                  className="btn-pixel bg-white px-6 py-3 text-base text-slate-900 sm:px-8 sm:py-3.5 sm:text-lg"
                >
                  Dengerin Podcast
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ 2) GRID 13 ANGGOTA (#anggota) — canvas krem ============ */}
      <section id="anggota" className="relative scroll-mt-24 overflow-hidden border-y-4 border-slate-900 bg-[#E8E2CB]">
        {/* Background Muka Sticker Bomb di Pinggir */}
        <FaceStickerBackground />

        {/* Container Utama dengan area aman (padding) biar card di tengah tidak tertimpa stiker pinggir */}
        <div className="relative z-10 mx-auto max-w-6xl px-10 sm:px-16 lg:px-24 py-16">
          <div className="max-w-2xl text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              14 Orang
            </h2>
            <p className="mt-3 text-base font-medium leading-relaxed text-slate-600">
              Klik salah satu foto kita buat ngebuka profil singkat kita ye: role, hobi, quotes,
              sampai lagu kesukaan kita (pls jangan anggep serius).
            </p>
          </div>

          {loading && (
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border-2 border-slate-900/20 bg-white/40 p-4">
                  <div className="aspect-square rounded-xl bg-white/60" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-white/60" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-white/50" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border-2 border-rose-500 bg-rose-50 p-6 text-left text-sm font-bold text-rose-600">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {(Array.isArray(members) ? members : []).map((member, i) => (
                <div
                  key={member?.id || i}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="animate-fade-up"
                >
                  <MemberCard member={member} onClick={() => setSelected(member)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ 3) PODCAST SECTION ============ */}
      <section
        id="podcast"
        className="scroll-mt-24 border-y-4 border-slate-900 bg-white/60"
      >
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Reveal animation="fade-up">
            <div className="max-w-2xl text-left">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
                Chikago Podcast
              </h2>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
                Bahasannya entah kenapa selalu nyasar — dari Labuan Bajo sampai DJ Ayam. Dengarin
                episode terbaru kita langsung dari sini.
              </p>
            </div>
          </Reveal>

          {latestEpisode ? (
            <Reveal animation="fade-up" delay={150}>
              <div className="mt-8 grid gap-6 sm:mt-10 md:grid-cols-5 md:items-start">
                {/* Player embed episode terbaru */}
                <div className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-slate-950 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] md:col-span-3">
                  {latestEmbed ? (
                    <iframe
                      title={`Chikago Podcast — ${latestEpisode.title}`}
                      src={latestEmbed}
                      width="100%"
                      height="352"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-[180px] flex-col items-center justify-center gap-2 p-6 text-center">
                      <p className="text-sm font-bold text-slate-300">
                        Link Spotify episode ini belum diisi.
                      </p>
                      <Link
                        to="/podcast"
                        className="btn-pixel border-2 border-slate-900 bg-white px-4 py-2 text-xs text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                      >
                        Buka halaman Podcast
                      </Link>
                    </div>
                  )}
                </div>

                {/* Kartu info episode terbaru */}
                <div className="rounded-2xl border-2 border-slate-900 bg-slate-950 p-5 text-left shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] sm:p-6 md:col-span-2">
                  <p className="text-xs font-black uppercase tracking-widest text-[#1DB954]">
                    Episode Terbaru
                  </p>
                  <p className="mt-2 text-lg font-extrabold leading-snug text-white sm:text-xl">
                    {latestEpisode.title}
                  </p>
                  {latestEpisode.duration && (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-900 bg-white px-2.5 py-1 text-xs font-black text-slate-900">
                      ▶ {latestEpisode.duration}
                    </p>
                  )}
                  <p className="mt-3 line-clamp-4 text-sm font-semibold leading-relaxed text-slate-300">
                    {latestEpisode.desc}
                  </p>
                  <Link
                    to="/podcast"
                    className="btn-pixel mt-5 inline-flex items-center gap-1 border-2 border-slate-900 bg-[#1DB954] px-4 py-2 text-sm text-slate-950 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:bg-[#1ed760]"
                  >
                    Semua Episode <ArrowRight size={15} className="stroke-[3]" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ) : (
            <div className="mt-8 rounded-2xl border-2 border-slate-900 bg-white p-4 text-left shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] sm:mt-10 sm:p-6">
              <p className="text-sm font-bold text-slate-600">
                Belum ada episode podcast. Tambah lewat menu Admin → Kelola Podcast.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ============ 4) CHIKAGO BEAT SECTION (HITAM SELEBAR LAYAR & FOTO HD) ============ */}
      <section className="w-full border-t-4 border-slate-900 bg-black py-6 sm:py-10">
        <Reveal animation="fade-up">
          <div className="mx-auto max-w-5xl px-3 sm:px-4 flex justify-center items-center">
            <img
              src="/chikago-beat.jpeg"
              alt="Chikago Beat - Coming Soon"
              className="w-full h-auto max-h-[250px] sm:max-h-[350px] md:max-h-[450px] object-contain block"
              onError={(e) => {
                e.currentTarget.src = '/chikago-beat.jpg';
              }}
            />
          </div>
        </Reveal>
      </section>

      {/* Pop-up biodata */}
      {selected && <MemberModal member={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}