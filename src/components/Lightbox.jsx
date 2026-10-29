import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Lightbox galeri — menampilkan foto lebih besar dengan navigasi.
 */
export default function Lightbox({ images, index, onClose, onNavigate }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate(1);
      if (e.key === 'ArrowLeft') onNavigate(-1);
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, onNavigate]);

  if (index == null || !images[index]) return null;
  const current = images[index];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau foto"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup foto"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/25"
      >
        <X size={20} />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Foto sebelumnya"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(-1);
            }}
            className="absolute left-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/25 md:left-6"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            aria-label="Foto berikutnya"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(1);
            }}
            className="absolute right-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/25 md:right-6"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <figure
        className="animate-fade-up max-h-full w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.src}
          alt={current.caption}
          className="max-h-[75vh] w-full rounded-2xl object-contain shadow-2xl"
        />
        <figcaption className="mt-3 text-center text-sm font-medium text-slate-300">
          {current.caption} • {index + 1}/{images.length}
        </figcaption>
      </figure>
    </div>
  );
}
