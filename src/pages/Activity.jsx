import { useEffect, useMemo, useState } from 'react';
import { Camera, ImageOff, Tag, X, ZoomIn } from 'lucide-react';
import { apiService } from '../lib/api';
import Lightbox from '../components/Lightbox';

/** Palet warna badge kategori (gaya neo-brutalist). */
const BADGE_PALETTES = [
  'bg-brand-pink text-slate-900',
  'bg-[#1DB954] text-slate-950',
  'bg-sky-300 text-slate-900',
  'bg-amber-300 text-slate-950',
  'bg-violet-300 text-slate-900',
  'bg-rose-300 text-slate-900',
];

/** Warna badge deterministik per kategori (dynamis, bukan hardcoded). */
function badgePalette(category) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash + category.charCodeAt(i)) % 997;
  return BADGE_PALETTES[hash % BADGE_PALETTES.length];
}

function CategoryBadge({ category, size = 'sm' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xl border-[3px] border-slate-900 font-black uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${badgePalette(
        category
      )} ${size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}`}
    >
      <Tag size={size === 'sm' ? 10 : 12} />
      {category}
    </span>
  );
}

export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('semua');
  const [selected, setSelected] = useState(null); // aktivitas terpilih (detail modal)
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    let active = true;
    apiService
      .getActivities()
      .then((data) => active && setActivities(data))
      .catch(() => active && setError('Gagal memuat data aktivitas.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  /** Daftar kategori diambil otomatis dari data (dinamis). */
  const categories = useMemo(
    () => [...new Set(activities.map((a) => a.category).filter(Boolean))],
    [activities]
  );

  const visible = useMemo(
    () => (filter === 'semua' ? activities : activities.filter((a) => a.category === filter)),
    [activities, filter]
  );

  /** Foto aktivitas terpilih dalam format siap lightbox. */
  const lightboxImages = useMemo(
    () =>
      selected
        ? selected.photos.map((src, i) => ({
            src,
            caption: `${selected.title} • Foto ${i + 1}`,
          }))
        : [],
    [selected]
  );

  // Kunci scroll saat modal detail terbuka
  useEffect(() => {
    if (selected) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selected]);

  // Escape menutup modal detail — hanya saat lightbox TIDAK sedang terbuka
  // (agar satu tekan Escape menutup lightbox dulu, tekanan kedua menutup modal)
  useEffect(() => {
    if (!selected || lightboxIndex != null) return;
    const handler = (e) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, lightboxIndex]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      {/* Header halaman */}
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-widest text-brand-pink">Dokumentasi</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Galeri Aktivitas Chikago
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-slate-700">
          Semua aktivitas komunitas dikumpulin jadi satu di sini. Klik kartunya buat ngeliat semua
          foto dokumentasinya.
        </p>
      </div>

      {/* Filter kategori dinamis (dibentuk dari data API) */}
      {categories.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {['semua', ...categories].map((cat) => {
            const isActive = filter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`btn-pixel px-5 py-2.5 text-xs ${
                  isActive ? 'bg-brand-pink text-slate-900' : 'bg-white text-slate-700 opacity-85 hover:opacity-100'
                }`}
              >
                {cat === 'semua' ? 'Semua Aktivitas' : cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Status memuat / error / kosong */}
      {loading && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border-2 border-slate-900/20 bg-white/40 p-4">
              <div className="aspect-[4/3] rounded-xl bg-white/60" />
              <div className="mt-4 h-4 w-3/4 rounded bg-white/60" />
              <div className="mt-2 h-3 w-1/2 rounded bg-white/50" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-10 rounded-2xl border-2 border-rose-500 bg-rose-50 p-6 text-center text-sm font-bold text-rose-600">
          {error}
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-slate-900 bg-white p-12 text-center">
          <ImageOff size={36} className="mx-auto text-slate-400" />
          <p className="mt-3 text-sm font-bold text-slate-500">
            Belum ada aktivitas{filter !== 'semua' ? ` kategori "${filter}"` : ''}.
          </p>
        </div>
      )}

      {/* ============ GRID KARTU AKTIVITAS TERPADU ============ */}
      {!loading && !error && visible.length > 0 && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((activity, i) => (
            <button
              key={activity.id}
              type="button"
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => {
                setSelected(activity);
                setLightboxIndex(null);
              }}
              className="animate-fade-up group overflow-hidden rounded-2xl border-2 border-slate-900 bg-white text-left shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition duration-200 hover:-translate-y-1"
              aria-label={`Buka detail aktivitas ${activity.title}`}
            >
              {/* Thumbnail */}
              <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-slate-900 bg-slate-100">
                {/* Placeholder di belakang — tampil jika foto kosong atau gagal dimuat */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageOff size={36} className="text-slate-400" />
                </div>
                {activity.photos.length > 0 && (
                  <img
                    src={activity.photos[0]}
                    alt={activity.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="relative h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                )}

                {/* Overlay hover */}
                <span className="absolute inset-0 flex items-center justify-center bg-brand-pink/40 opacity-0 backdrop-blur-[2px] transition duration-200 group-hover:opacity-100">
                  <span className="btn-pixel bg-white px-3.5 py-1.5 text-xs text-slate-900">
                    <ZoomIn size={14} className="text-brand-pink" /> Lihat Galeri
                  </span>
                </span>

                {/* Badge kategori gaya neo-brutalist */}
                <span className="absolute left-3 top-3">
                  <CategoryBadge category={activity.category} />
                </span>

                {/* Jumlah foto */}
                <span className="absolute bottom-3 right-3 rounded-lg border-2 border-slate-900 bg-white px-2 py-0.5 text-[10px] font-black text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  {activity.photos.length} Foto
                </span>
              </div>

              {/* Info aktivitas */}
              <div className="p-4">
                <p className="font-extrabold text-slate-900">{activity.title}</p>
                <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-600">
                  {activity.desc || 'Tidak ada deskripsi.'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ============ MODAL DETAIL AKTIVITAS ============ */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Detail aktivitas ${selected.title}`}
          onClick={() => setSelected(null)}
        >
          <div
            className="thin-scrollbar animate-fade-up max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border-2 border-slate-900 bg-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b-2 border-slate-900 bg-brand-yellow p-5">
              <div>
                <CategoryBadge category={selected.category} size="md" />
                <h2 className="mt-2 text-xl font-extrabold text-slate-900">{selected.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Tutup detail aktivitas"
                className="btn-pixel shrink-0 bg-white p-2 text-slate-900"
              >
                <X size={16} />
              </button>
            </div>

            {/* Deskripsi */}
            <div className="px-5 pt-4">
              <p className="text-sm font-medium leading-relaxed text-slate-700">
                {selected.desc || 'Tidak ada deskripsi untuk aktivitas ini.'}
              </p>
            </div>

            {/* Galeri foto lengkap */}
            {selected.photos.length === 0 ? (
              <div className="m-5 rounded-xl border-2 border-dashed border-slate-900 p-8 text-center text-sm font-bold text-slate-500">
                Belum ada foto untuk aktivitas ini.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-3">
                {selected.photos.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-slate-900 bg-slate-100 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition duration-200 hover:-translate-y-0.5"
                    aria-label={`Perbesar foto ${i + 1} ${selected.title}`}
                  >
                    <img
                      src={src}
                      alt={`${selected.title} foto ${i + 1}`}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-brand-pink/40 opacity-0 transition group-hover:opacity-100">
                      <span className="btn-pixel bg-white px-3 py-1 text-[11px] text-slate-900">
                        <Camera size={12} className="text-brand-pink" /> Perbesar
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox foto besar */}
      <Lightbox
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(step) =>
          setLightboxIndex(
            (i) => (i + step + lightboxImages.length) % lightboxImages.length
          )
        }
      />
    </div>
  );
}
