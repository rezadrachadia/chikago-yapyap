import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';

// Menu utama header (satu sumber untuk desktop & mobile).
// Urutan: Home, Activities, Chikago Beat, Contact Us
const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/aktivitas', label: 'Activities' },
  { beat: true, label: 'Chikago Beat' },
  { contact: true, label: 'Contact Us' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [beatOpen, setBeatOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Tutup modal Chikago Beat dengan tombol Esc
  useEffect(() => {
    if (!beatOpen) return undefined;
    const handler = (e) => e.key === 'Escape' && setBeatOpen(false);
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [beatOpen]);

  // Smooth scroll menuju elemen #footer (Contact Us)
  const goToFooter = () => {
    setOpen(false);
    const scroll = () => {
      const footer = document.getElementById('footer');
      if (footer) {
        footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    if (pathname === '/') {
      scroll();
    } else {
      navigate('/');
      setTimeout(scroll, 350);
    }
  };

  // Navigasi teks biasa, cuma dikasih frame saat aktif
  const linkClass = ({ isActive }) =>
    `px-4 py-2 text-sm font-extrabold transition-all duration-150 ${
      isActive
        ? 'rounded-xl border-2 border-slate-900 bg-white text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
        : 'rounded-xl text-white/90 hover:bg-white/10 hover:text-white'
    }`;

  const beatClass =
    'px-4 py-2 text-sm font-extrabold rounded-xl text-white/90 transition-all duration-150 hover:bg-white/10 hover:text-white';

  const contactClass =
    'px-4 py-2 text-sm font-extrabold rounded-xl text-white/90 transition-all duration-150 hover:bg-white/10 hover:text-white';

  const openBeat = () => {
    setOpen(false);
    setBeatOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-slate-900 bg-brand-pink text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo dengan Foto Team */}
          <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border-2 border-slate-900 bg-brand-yellow shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <img
                src="/chikago-team.jpg"
                alt="Chikago Logo"
                className="h-full w-full object-cover"
              />
            </span>
            <span className="leading-tight">
              <span className="block text-xl font-black tracking-tight text-white drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,1)]">
                Chikago
              </span>
              <span className="block text-[11px] font-extrabold text-white/80">
                Chikagoyapyap Ltd
              </span>
            </span>
          </Link>

          {/* Navigasi Desktop */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) =>
              item.beat ? (
                <button key="beat" type="button" onClick={openBeat} className={beatClass}>
                  {item.label}
                </button>
              ) : item.contact ? (
                <button key="contact" type="button" onClick={goToFooter} className={contactClass}>
                  {item.label}
                </button>
              ) : (
                <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === '/'}>
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          {/* Tombol Burger Mobile */}
          <button
            type="button"
            aria-label="Buka menu navigasi"
            className="rounded-xl border-2 border-slate-900 bg-white p-2 text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <X size={20} className="stroke-[2.5]" />
            ) : (
              <Menu size={20} className="stroke-[2.5]" />
            )}
          </button>
        </div>

        {/* Navigasi Mobile */}
        {open && (
          <nav className="animate-fade-up border-t-2 border-slate-900 bg-brand-pink px-4 pb-4 pt-3 lg:hidden">
            <div className="flex flex-col gap-2 rounded-2xl border-2 border-slate-900 bg-white p-3 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              {NAV_ITEMS.map((item) =>
                item.beat ? (
                  <button
                    key="beat"
                    type="button"
                    onClick={openBeat}
                    className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-extrabold text-slate-700 transition hover:bg-slate-100"
                  >
                    {item.label}
                  </button>
                ) : item.contact ? (
                  <button
                    key="contact"
                    type="button"
                    onClick={goToFooter}
                    className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-extrabold text-slate-700 transition hover:bg-slate-100"
                  >
                    {item.label}
                  </button>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `w-full rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
                        isActive
                          ? 'border-2 border-slate-900 bg-brand-pink text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`
                    }
                    end={item.to === '/'}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                )
              )}
            </div>
          </nav>
        )}
      </header>

      {/* ============ MODAL CHIKAGO BEAT — COMING SOON ============ */}
      {beatOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Chikago Beat — Coming soon"
          onClick={() => setBeatOpen(false)}
        >
          <div
            className="animate-fade-up relative w-full max-w-md overflow-hidden rounded-2xl border-4 border-slate-900 bg-brand-yellow text-left shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Strip aksen pink */}
            <div aria-hidden="true" className="h-3 border-b-4 border-slate-900 bg-brand-pink" />

            <button
              type="button"
              onClick={() => setBeatOpen(false)}
              aria-label="Tutup info Chikago Beat"
              className="btn-pixel absolute right-3 top-6 z-10 rounded-xl border-2 border-slate-900 bg-white p-2 text-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition hover:bg-rose-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
            >
              <X size={16} />
            </button>

            <div className="p-7 pt-8">
              <p className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-900 bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <Sparkles size={12} /> Chikago Beat
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 drop-shadow-[2px_2px_0px_rgba(255,255,255,0.8)] sm:text-5xl">
                Coming soon...
              </h2>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-700">
                Halaman Chikago Beat lagi on progress nih, tungguin yah.
              </p>
              <button
                type="button"
                onClick={() => setBeatOpen(false)}
                className="btn-pixel mt-6 inline-flex items-center gap-2 bg-brand-pink px-5 py-2.5 text-sm text-slate-900"
              >
                Oke, ditunggu!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
