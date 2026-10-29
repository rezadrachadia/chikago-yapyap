import { User, Music, Quote } from 'lucide-react';
import { isSpotifyUrl, fotoFrameStyle } from '../lib/api';

/**
 * Card profil anggota — style cutout:
 * foto PNG transparan "berdiri" tanpa kotak background lalu
 * menumpuk di atas kartu informasi putih (rounded-2xl bg-white).
 * Ada 4 info: Nama, Role (user), Lagu (Spotify green), Quotes.
 */
export default function MemberCard({ member, onClick }) {
  const hasSpotify = isSpotifyUrl(member.laguSpotify);
  const laguJudul = member.lagu?.judul || '';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block w-full text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/30"
      aria-label={`Lihat biodata ${member.nama}`}
    >
      {/* Foto cutout — wrapper dengan overflow-hidden untuk potong kaki yang offside */}
      <div className="relative z-[5] -mb-6 h-52 w-full overflow-hidden sm:h-60">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-full items-end justify-center">
          <img
            src={member.foto}
            alt={member.nama}
            loading="lazy"
            style={fotoFrameStyle(member)}
            className="h-[110%] w-auto object-contain object-bottom"
          />
        </div>
      </div>

      {/* Kartu informasi putih */}
      <div className="relative z-10 rounded-2xl border-2 border-slate-900 bg-white p-4 pt-8 text-left shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
        {/* 1) Nama */}
        <p className="truncate text-base font-bold text-slate-900">{member.nama}</p>

        {/* 2) Role + icon user */}
        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <User size={13} className="shrink-0 text-slate-900" />
          <span className="truncate">{member.role}</span>
        </p>

        {/* 3) Lagu kesukaan + icon musik (hijau Spotify) */}
        {(hasSpotify || laguJudul) && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#1DB954]">
            <Music size={13} className="shrink-0" />
            <span className="truncate">
              {hasSpotify ? 'Lagu kesukaan di Spotify' : laguJudul}
            </span>
          </p>
        )}

        {/* 4) Quotes + icon quote (abu-abu subtle) */}
        {member.quotes && (
          <p className="mt-1.5 flex gap-1.5 text-xs italic leading-relaxed text-slate-400">
            <Quote size={13} className="mt-0.5 shrink-0" />
            <span className="line-clamp-2">{member.quotes}</span>
          </p>
        )}
      </div>
    </button>
  );
}