import { useEffect } from 'react';
import { X, User, Heart, Quote, Music } from 'lucide-react';
import { toSpotifyEmbed, fotoFrameStyle } from '../lib/api';

/**
 * Pop-up modal biodata lengkap anggota — selaras dengan tema member:
 * canvas krem (#E8E2CB), foto PNG cutout transparan yang "berdiri"
 * (tanpa kotak background, kepala/badan proporsional), lalu kartu
 * nama putih menumpuk di bagian bawah foto.
 *
 * Detail yang dipertahankan: Spotify Embed, hobi, role, quotes.
 */
export default function MemberModal({ member, onClose }) {
  // Tutup dengan tombol Esc
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!member) return null;

  // Embed lagu member (fallback ke teks lama jika link belum diisi)
  const spotifyEmbed = toSpotifyEmbed(member.laguSpotify);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Biodata ${member.nama}`}
      onClick={onClose}
    >
      <div
        className="animate-fade-up thin-scrollbar relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol tutup */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup biodata"
          className="btn-pixel absolute right-3 top-3 z-20 rounded-xl border-2 border-slate-900 bg-white p-2 text-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition hover:bg-rose-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
        >
          <X size={18} />
        </button>

        {/* ============ AREA FOTO CUTOUT (canvas krem) ============ */}
        <div className="relative h-80 overflow-hidden border-b-4 border-slate-900 bg-[#E8E2CB] sm:h-96">
          {/* Pola titik halus biar canvas nggak flat */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage: 'radial-gradient(#0f172a 1.5px, transparent 1.5px)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* Foto PNG transparan: object-contain + posisi dari adjuster admin */}
          <img
            src={member.foto}
            alt={member.nama}
            style={fotoFrameStyle(member)}
            className="relative h-full w-full object-contain object-bottom pb-16 drop-shadow-[0_14px_18px_rgba(15,23,42,0.3)]"
          />

          {/* Kartu nama & role menumpuk di bawah foto */}
          <div className="absolute inset-x-4 bottom-4 z-10 rounded-2xl border-2 border-slate-900 bg-white p-4 text-left shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <p className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
              {member.nama}
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-900 bg-brand-yellow px-2.5 py-1 text-xs font-black text-slate-900">
              <User size={13} /> {member.role}
            </p>
          </div>
        </div>

        {/* ============ DETAIL BIODATA ============ */}
        <div className="space-y-5 p-6">
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-rose-200 text-rose-700 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <Heart size={18} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Hobi</p>
              <p className="text-base font-bold text-slate-800">{member.hobi || '-'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-amber-200 text-amber-800 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <Quote size={18} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Quotes Favorit
              </p>
              <p className="text-base font-bold italic text-slate-800">
                “{member.quotes || '-'}”
              </p>
            </div>
          </div>

          {/* ============ LAGU KESUKAAN (SPOTIFY EMBED) ============ */}
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-[#1DB954] text-slate-950 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <Music size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Lagu Kesukaan
              </p>

              {spotifyEmbed ? (
                <>
                  <p className="mb-2 text-sm font-bold text-slate-800">Lagu andalannya nih:</p>
                  <div className="overflow-hidden rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                    <iframe
                      title={`Lagu kesukaan ${member.nama} di Spotify`}
                      src={spotifyEmbed}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    />
                  </div>
                </>
              ) : member.lagu?.judul ? (
                <>
                  <p className="text-sm font-bold text-slate-800">{member.lagu.judul}</p>
                  <p className="text-xs font-medium text-slate-500">
                    {member.lagu.artis}
                    {member.lagu.album ? ` • Album ${member.lagu.album}` : ''}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-slate-400">
                  Belum diisi. Admin bisa isi lewat Link Track Spotify di dashboard.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
