import { SiInstagram, SiSpotify, SiGmail } from 'react-icons/si';
import { Heart } from 'lucide-react';

const SOCIALS = [
  { icon: SiInstagram, label: 'Instagram', href: 'https://www.instagram.com/chikagoyapyap/' },
  {
    icon: SiSpotify,
    label: 'Spotify',
    href: 'https://open.spotify.com/show/3R7IdebXtD8BvIwi8bEdl1?si=85ffc3ac073c4bb8',
  },
  { icon: SiGmail, label: 'Email', href: 'mailto:true.chikago@gmail.com' },
];

/**
 * Footer dengan warna background SAMA PERSIS dengan header (bg-brand-pink)
 * + gaya Neo-Brutalism: border tebal, tombol sosmed kotak ber-shadow tajam,
 * dan copyright rapi. id="footer" tetap dipertahankan sebagai anchor.
 */
export default function Footer() {
  return (
    <footer
      id="footer"
      className="relative mt-0 w-full scroll-mt-24 overflow-hidden border-t-4 border-slate-900 bg-brand-pink text-slate-900"
    >
      {/* Aksen pola titik pixel halus */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(#0f172a 1.5px, transparent 1.5px)',
          backgroundSize: '18px 18px',
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8 sm:py-12">
        {/* Baris atas: identitas komunitas + tombol sosmed */}
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          <div className="max-w-md text-left">
            <p className="text-3xl font-black tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(15,23,42,1)]">
              Chikagoyapyap
            </p>
            <p className="mt-2 text-sm font-bold leading-relaxed text-white/90">
              Komunitas yang hidupnya terlalu singkat untuk ditanggapi serius. Hubungi kami buat
              kolaborasi.
            </p>
          </div>

          <nav aria-label="Contact Us" className="text-left">
            <p className="mb-2.5 text-xs font-black uppercase tracking-widest text-white drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,1)]">
              Contact Us :
            </p>
            <div className="flex items-center gap-3">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="btn-pixel flex h-12 w-12 items-center justify-center border-2 border-slate-900 bg-white text-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition hover:-translate-y-0.5 hover:bg-brand-yellow active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* Divider pixel */}
        <div aria-hidden="true" className="h-1.5 w-full border-2 border-slate-900 bg-white/90" />

        {/* Baris bawah: copyright */}
        <div className="flex flex-col items-start justify-between gap-3 text-xs font-black text-white sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Chikagoyapyap Ltd. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5 drop-shadow-[1px_1px_0px_rgba(15,23,42,1)]">
            Dibuat dengan{' '}
            <Heart size={13} className="fill-current text-rose-400 stroke-slate-900" /> oleh
            Reza untuk Chikago
          </p>
        </div>
      </div>
    </footer>
  );
}