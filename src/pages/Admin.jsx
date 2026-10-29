import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LockKeyhole,
  LogOut,
  Users,
  Inbox,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  RotateCcw,
  X,
  Loader2,
  Music,
  Camera,
  Podcast as PodcastIcon,
  ImageOff,
  ExternalLink,
  Link2Off,
  Upload,
  Crop,
} from 'lucide-react';
import {
  apiService,
  uploadService,
  isSpotifyUrl,
  toSpotifyEmbed,
  fotoFrameStyle,
  FOTO_FRAME_DEFAULTS,
} from '../lib/api';

const EMPTY_MEMBER = {
  nama: '',
  role: 'Anggota Aktif',
  hobi: '',
  quotes: '',
  laguSpotify: '',
  foto: '/avatars/member-01.svg',
  ...FOTO_FRAME_DEFAULTS, // zoom & posisi bingkai foto (adjuster)
};

const EMPTY_ACTIVITY = {
  title: '',
  category: '',
  desc: '',
  photos: '',
};

const EMPTY_PODCAST = {
  no: '',
  title: '',
  duration: '',
  desc: '',
  spotifyLink: '',
};

const AVATAR_CHOICES = Array.from(
  { length: 14 },
  (_, i) => `/avatars/member-${String(i + 1).padStart(2, '0')}.svg`
);

const FIELD_CLASS =
  'w-full rounded-xl border-2 border-slate-900 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-brand-pink';
const LABEL_CLASS = 'mb-1 block text-xs font-black uppercase text-slate-900';

/* ============ Toast sederhana (Pixel Style) ============ */
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className="fixed bottom-5 left-1/2 z-[60] w-[92%] max-w-sm -translate-x-1/2">
      <div
        className={`animate-fade-up flex items-start gap-3 rounded-xl border-2 border-slate-900 p-4 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] ${
          isError ? 'bg-rose-100 text-rose-900' : 'bg-emerald-100 text-emerald-950'
        }`}
      >
        {isError ? (
          <X size={18} className="mt-0.5 shrink-0" />
        ) : (
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#1DB954]" />
        )}
        <p className="flex-1">{toast.message}</p>
        <button type="button" onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/* ============ Shell modal form ============ */
function FormModalShell({ title, onClose, onSubmit, saving, submitLabel, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="thin-scrollbar animate-fade-up max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form"
            className="btn-pixel bg-white p-1.5 text-slate-900 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 space-y-4">{children}</div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="btn-pixel bg-white text-slate-900 px-5 py-2 text-xs"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-pixel bg-brand-pink text-slate-900 px-5 py-2 text-xs"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

/* Batas ukuran file foto profil (sama dengan limit multer di backend) */
const MAX_PHOTO_MB = 5;

const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));

/* ============ Cropper foto ala Discord (grid + drag + zoom) ============ */
function FotoCropModal({ src, initial, onApply, onClose }) {
  const [zoom, setZoom] = useState(clampValue(Number(initial?.fotoZoom) || 1, 1, 3));
  const [posX, setPosX] = useState(clampValue(Number(initial?.fotoPosX ?? 50), 0, 100));
  const [posY, setPosY] = useState(clampValue(Number(initial?.fotoPosY ?? 50), 0, 100));
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef(null);
  const dragRef = useRef(null);

  // Esc untuk batal
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const startDrag = (e) => {
    const frame = frameRef.current;
    if (!frame) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX,
      posY,
      size: frame.getBoundingClientRect().width || 1,
    };
    setDragging(true);
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveDrag = (e) => {
    const d = dragRef.current;
    if (!d) return;
    // 1px geser layar ≈ 1px geser foto; pos 0–100 dipetakan ke translate 0.6
    const perPixel = 100 / (d.size * 0.6);
    setPosX(clampValue(d.posX + (e.clientX - d.startX) * perPixel, 0, 100));
    setPosY(clampValue(d.posY + (e.clientY - d.startY) * perPixel, 0, 100));
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const reset = () => {
    setZoom(1);
    setPosX(50);
    setPosY(50);
  };

  const changeZoom = (delta) => setZoom((z) => clampValue(Number((z + delta).toFixed(2)), 1, 3));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Atur posisi foto profil"
      onClick={onClose}
    >
      <div
        className="animate-fade-up flex max-h-[92vh] w-full max-w-md flex-col overflow-y-auto rounded-2xl border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-slate-900 bg-brand-yellow px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Adjuster Foto
            </p>
            <h3 className="text-lg font-black leading-tight text-slate-900">Atur Posisi Foto</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup adjuster foto"
            className="btn-pixel rounded-xl border-2 border-slate-900 bg-white p-1.5 text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:bg-rose-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          {/* Bingkai preview + grid ala Discord */}
          <div
            ref={frameRef}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            onPointerCancel={endDrag}
            style={{ touchAction: 'none' }}
            className={`relative aspect-square w-full select-none overflow-hidden rounded-xl border-4 border-slate-900 bg-[#E8E2CB] ${
              dragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Pola titik halus */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage: 'radial-gradient(#0f172a 1.5px, transparent 1.5px)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* Foto PNG */}
            <img
              src={src}
              alt="Preview foto yang akan diatur"
              draggable={false}
              style={{
                transform: `translate(${(posX - 50) * 0.6}%, ${(posY - 50) * 0.6}%) scale(${zoom})`,
                transformOrigin: 'center',
              }}
              className="relative h-full w-full object-contain object-bottom drop-shadow-[0_14px_18px_rgba(15,23,42,0.3)]"
            />

            {/* Grid rule-of-thirds ala cropper Discord */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute inset-y-0 left-1/3 w-px bg-slate-900/35" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-slate-900/35" />
              <div className="absolute inset-x-0 top-1/3 h-px bg-slate-900/35" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-slate-900/35" />
              {/* Corner brackets */}
              <div className="absolute left-2 top-2 h-5 w-5 border-l-4 border-t-4 border-slate-900" />
              <div className="absolute right-2 top-2 h-5 w-5 border-r-4 border-t-4 border-slate-900" />
              <div className="absolute bottom-2 left-2 h-5 w-5 border-b-4 border-l-4 border-slate-900" />
              <div className="absolute bottom-2 right-2 h-5 w-5 border-b-4 border-r-4 border-slate-900" />
            </div>

            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 rounded border-2 border-slate-900 bg-white/90 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-900">
              Drag
            </span>
          </div>

          <p className="mt-2 text-center text-[11px] font-bold text-slate-500">
            Drag foto untuk atur posisi · gunakan zoom untuk memperbesar
          </p>

          {/* Kontrol zoom */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wide text-slate-700">
              <span>Zoom</span>
              <span>{zoom.toFixed(2)}x</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeZoom(-0.1)}
                disabled={zoom <= 1}
                aria-label="Zoom out"
                className="btn-pixel rounded-lg border-2 border-slate-900 bg-white px-2.5 py-1 text-sm font-black text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] disabled:opacity-40"
              >
                −
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-brand-pink"
                aria-label="Zoom foto"
              />
              <button
                type="button"
                onClick={() => changeZoom(0.1)}
                disabled={zoom >= 3}
                aria-label="Zoom in"
                className="btn-pixel rounded-lg border-2 border-slate-900 bg-white px-2.5 py-1 text-sm font-black text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Footer aksi */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-dashed border-slate-300 px-4 py-3">
          <button
            type="button"
            onClick={reset}
            className="btn-pixel inline-flex items-center gap-1 border-2 border-slate-900 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:bg-brand-yellow"
          >
            <RotateCcw size={12} /> Reset
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() =>
                onApply({
                  fotoZoom: Number(zoom.toFixed(2)),
                  fotoPosX: Math.round(posX),
                  fotoPosY: Math.round(posY),
                })
              }
              className="btn-pixel bg-brand-pink px-4 py-1.5 text-xs text-slate-900"
            >
              Pakai Foto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Form modal CRUD member ============ */
function MemberFormModal({ initial, saving, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const linkValid = !form.laguSpotify || isSpotifyUrl(form.laguSpotify);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [cropOpen, setCropOpen] = useState(false);

  // Upload foto profil (khusus PNG) dari perangkat -> backend simpan ke /uploads/members/
  const handleUploadPhoto = async (e) => {
    // Salin dulu filenya — daftar bisa hilang saat value input di-reset
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // reset supaya file yang sama bisa dipilih ulang
    if (!file) return;
    // Restriksi 1: hanya format PNG (mendukung transparansi untuk cutout)
    if (file.type !== 'image/png') {
      setUploadError('Hanya file PNG yang diizinkan untuk foto profil member.');
      return;
    }
    // Restriksi 2: ukuran maksimal 5MB
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setUploadError(
        `Ukuran file terlalu besar (${sizeMb} MB). Maksimal ${MAX_PHOTO_MB} MB ya.`
      );
      return;
    }
    setUploadError('');
    setUploading(true);
    try {
      const result = await uploadService.uploadMemberPhoto(file);
      // Foto baru -> reset zoom & posisi, lalu langsung buka cropper ala Discord
      setForm((f) => ({ ...f, foto: result.url, ...FOTO_FRAME_DEFAULTS }));
      setCropOpen(true);
    } catch (err) {
      setUploadError(err.message || 'Upload foto gagal.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
    <FormModalShell
      title={form.id ? 'Edit Biodata Anggota' : 'Tambah Anggota Baru'}
      onClose={onClose}
      onSubmit={() => onSave(form)}
      saving={saving}
      submitLabel={form.id ? 'Simpan Perubahan' : 'Tambah Anggota'}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS} htmlFor="m-nama">
            Nama *
          </label>
          <input
            id="m-nama"
            className={FIELD_CLASS}
            required
            value={form.nama}
            onChange={(e) => setField('nama', e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL_CLASS} htmlFor="m-role">
            Role
          </label>
          <input
            id="m-role"
            className={FIELD_CLASS}
            value={form.role}
            onChange={(e) => setField('role', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="m-hobi">
          Hobi
        </label>
        <input
          id="m-hobi"
          className={FIELD_CLASS}
          value={form.hobi}
          onChange={(e) => setField('hobi', e.target.value)}
        />
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="m-quotes">
          Quotes Favorit
        </label>
        <textarea
          id="m-quotes"
          rows={2}
          className={`${FIELD_CLASS} resize-y`}
          value={form.quotes}
          onChange={(e) => setField('quotes', e.target.value)}
        />
      </div>

      {/* ============ Link Lagu Spotify (menggantikan input teks manual) ============ */}
      <div>
        <label className={LABEL_CLASS} htmlFor="m-lagu-spotify">
          <Music size={12} className="mr-1 inline text-[#1DB954]" /> Link Lagu Spotify
        </label>
        <input
          id="m-lagu-spotify"
          type="url"
          className={FIELD_CLASS}
          placeholder="https://open.spotify.com/track/..."
          value={form.laguSpotify}
          onChange={(e) => setField('laguSpotify', e.target.value)}
        />
        {!linkValid ? (
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-rose-600">
            <Link2Off size={12} /> Bukan link Spotify yang valid.
          </p>
        ) : (
          <p className="mt-1 text-xs font-medium text-slate-500">
            Buka lagu di Spotify → Share → Copy link, tempel di sini. Widget player otomatis tampil
            di profil member.
          </p>
        )}
        {linkValid && form.laguSpotify && (
          <a
            href={form.laguSpotify}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#1DB954] hover:underline"
          >
            <ExternalLink size={12} /> Cek link lagu ini
          </a>
        )}
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="m-foto">
          Foto Profil
        </label>

        {/* Preview cutout + tombol upload PNG-only */}
        <div className="rounded-xl border-2 border-slate-900 bg-slate-50 p-3">
          <div className="flex items-start gap-4">
            {/* Preview gaya card member: canvas krem + foto PNG cutout */}
            <div className="relative flex h-36 w-28 shrink-0 items-end justify-center overflow-hidden rounded-xl border-2 border-slate-900 bg-[#E8E2CB] shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.18]"
                style={{
                  backgroundImage: 'radial-gradient(#0f172a 1.5px, transparent 1.5px)',
                  backgroundSize: '14px 14px',
                }}
              />
              <img
                src={form.foto}
                alt="Preview foto profil"
                style={fotoFrameStyle(form)}
                className="relative h-full w-full object-contain object-bottom drop-shadow-[0_8px_10px_rgba(15,23,42,0.3)]"
              />
              <span className="absolute bottom-1 left-1 rounded border-2 border-slate-900 bg-white px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-900">
                Preview
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current && fileRef.current.click()}
                  disabled={uploading}
                  className="btn-pixel bg-brand-pink px-4 py-2 text-xs text-slate-900"
                >
                  {uploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  {uploading ? 'Mengunggah...' : 'Upload Foto PNG'}
                </button>
                <button
                  type="button"
                  onClick={() => setCropOpen(true)}
                  className="btn-pixel inline-flex items-center gap-1 border-2 border-slate-900 bg-white px-3 py-2 text-xs text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:bg-brand-yellow"
                >
                  <Crop size={14} /> Atur Posisi Foto
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png"
                className="hidden"
                onChange={handleUploadPhoto}
              />
              <p className="mt-1.5 text-xs font-medium text-slate-500">
                <b>Hanya PNG</b> (maks {MAX_PHOTO_MB}MB) — disimpan ke{' '}
                <code className="rounded border border-slate-900 bg-slate-200 px-1 font-mono">
                  /uploads/members/
                </code>
                . PNG transparan tampil cutout tanpa kotak background.
              </p>
              {uploadError && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-rose-600">
                  <Link2Off size={12} /> {uploadError}
                </p>
              )}
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                Zoom{' '}
                {(
                  Number.isFinite(Number(form.fotoZoom)) ? Number(form.fotoZoom) : 1
                ).toFixed(2)}
                x · Posisi{' '}
                {Math.round(Number.isFinite(Number(form.fotoPosX)) ? Number(form.fotoPosX) : 50)}% /{' '}
                {Math.round(Number.isFinite(Number(form.fotoPosY)) ? Number(form.fotoPosY) : 50)}%
              </p>
            </div>
          </div>
        </div>

        <select
          id="m-foto"
          className={`${FIELD_CLASS} mt-3`}
          value={form.foto}
          onChange={(e) => setField('foto', e.target.value)}
        >
          {AVATAR_CHOICES.map((src, i) => (
            <option key={src} value={src}>
              Avatar {String(i + 1).padStart(2, '0')}
            </option>
          ))}
          {/* Foto hasil upload tidak ada di daftar avatar — tampilkan sebagai opsi custom */}
          {!AVATAR_CHOICES.includes(form.foto) && form.foto && (
            <option value={form.foto}>Foto Upload (custom)</option>
          )}
        </select>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Pilih salah satu avatar bawaan, atau upload foto PNG asli anggota lewat tombol di atas.
        </p>
      </div>
      </FormModalShell>

      {/* Modal cropper ala Discord (di luar shell biar tidak terpengaruh transform) */}
      {cropOpen && (
        <FotoCropModal
          src={form.foto}
          initial={form}
          onApply={(frame) => {
            setForm((f) => ({ ...f, ...frame }));
            setCropOpen(false);
          }}
          onClose={() => setCropOpen(false)}
        />
      )}
    </>
  );
}

/* ============ Form modal CRUD Aktivitas ============ */
function ActivityFormModal({ initial, saving, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const photoList = form.photos
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  // Upload multi foto dari perangkat -> backend simpan ke /uploads/activities/
  const handleUploadPhotos = async (e) => {
    // Salin dulu ke array — FileList bisa kosong saat value di-reset
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = ''; // reset supaya file yang sama bisa dipilih ulang
    if (files.length === 0) return;
    setUploadError('');
    setUploading(true);
    try {
      const result = await uploadService.uploadActivityPhotos(files);
      setForm((f) => ({
        ...f,
        photos: [f.photos.trim(), result.urls.join('\n')].filter(Boolean).join('\n'),
      }));
    } catch (err) {
      setUploadError(err.message || 'Upload foto gagal.');
    } finally {
      setUploading(false);
    }
  };

  // Hapus satu foto dari daftar (berdasarkan index di daftar hasil parse)
  const removePhoto = (index) => {
    setForm((f) => {
      const lines = f.photos
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      lines.splice(index, 1);
      return { ...f, photos: lines.join('\n') };
    });
  };

  return (
    <FormModalShell
      title={form.id ? 'Edit Aktivitas' : 'Tambah Aktivitas Baru'}
      onClose={onClose}
      onSubmit={() => onSave(form)}
      saving={saving}
      submitLabel={form.id ? 'Simpan Perubahan' : 'Tambah Aktivitas'}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS} htmlFor="a-title">
            Nama Aktivitas *
          </label>
          <input
            id="a-title"
            className={FIELD_CLASS}
            required
            placeholder="Chikago Minsoc Vol.2"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL_CLASS} htmlFor="a-category">
            Kategori
          </label>
          <input
            id="a-category"
            className={FIELD_CLASS}
            placeholder="Futsal / Mini-Soccer / Nongkrong..."
            list="kategori-aktivitas"
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="a-desc">
          Deskripsi
        </label>
        <textarea
          id="a-desc"
          rows={3}
          className={`${FIELD_CLASS} resize-y`}
          placeholder="Cerita singkat soal aktivitas ini..."
          value={form.desc}
          onChange={(e) => setField('desc', e.target.value)}
        />
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="a-photos">
          Foto / Dokumentasi
        </label>

        {/* Tombol upload multi file + status */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-slate-900 bg-slate-50 p-3">
          <button
            type="button"
            onClick={() => fileRef.current && fileRef.current.click()}
            disabled={uploading}
            className="btn-pixel bg-brand-pink text-slate-900 px-4 py-2 text-xs"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Mengunggah...' : 'Upload Foto (Bisa Multi)'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUploadPhotos}
          />
          <p className="text-xs font-medium text-slate-500">
            JPG/PNG/WebP maks 5MB/file — file tersimpan di{' '}
            <code className="rounded border border-slate-900 bg-slate-200 px-1 font-mono">
              /uploads/activities/
            </code>
          </p>
        </div>
        {uploadError && (
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-rose-600">
            <Link2Off size={12} /> {uploadError}
          </p>
        )}

        {/* Daftar thumbnail foto — klik X untuk mengeluarkan dari daftar */}
        {photoList.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-black uppercase text-slate-900">
              Foto terpilih ({photoList.length})
            </p>
            <div className="grid grid-cols-4 gap-2">
              {photoList.map((src, i) => (
                <div key={`${src}-${i}`} className="relative">
                  <img
                    src={src}
                    alt={`Foto ${i + 1}`}
                    className="h-16 w-full rounded-lg border-2 border-slate-900 bg-white object-cover shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label={`Keluarkan foto ${i + 1}`}
                    className="absolute -right-1.5 -top-1.5 rounded-full border-2 border-slate-900 bg-rose-400 p-0.5 text-slate-950 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <textarea
          id="a-photos"
          rows={4}
          className={`${FIELD_CLASS} mt-3 resize-y font-mono text-xs`}
          placeholder={'/uploads/activities/2026...jpg\nhttps://example.com/foto-luar.jpg\n(1 URL per baris — bisa juga ditambah manual)'}
          value={form.photos}
          onChange={(e) => setField('photos', e.target.value)}
        />
        <p className="mt-1 text-xs font-medium text-slate-500">
          Satu URL per baris — hasil upload otomatis ditambahkan ke daftar ini, dan bisa juga
          ditambah manual.
        </p>
      </div>
    </FormModalShell>
  );
}

/* ============ Form modal CRUD Episode Podcast ============ */
function PodcastFormModal({ initial, saving, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const linkValid = !form.spotifyLink || isSpotifyUrl(form.spotifyLink);

  return (
    <FormModalShell
      title={form.id ? `Edit Episode ${form.no}` : 'Tambah Episode Podcast'}
      onClose={onClose}
      onSubmit={() => onSave(form)}
      saving={saving}
      submitLabel={form.id ? 'Simpan Perubahan' : 'Tambah Episode'}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS} htmlFor="p-no">
            Nomor Episode *
          </label>
          <input
            id="p-no"
            type="number"
            min="1"
            className={FIELD_CLASS}
            required
            placeholder="4"
            value={form.no}
            onChange={(e) => setField('no', e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL_CLASS} htmlFor="p-duration">
            Durasi
          </label>
          <input
            id="p-duration"
            className={FIELD_CLASS}
            placeholder="45 Menit"
            value={form.duration}
            onChange={(e) => setField('duration', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="p-title">
          Judul Episode *
        </label>
        <input
          id="p-title"
          className={FIELD_CLASS}
          required
          placeholder="Episode 4 - ..."
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
        />
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="p-desc">
          Deskripsi / Show Notes
        </label>
        <textarea
          id="p-desc"
          rows={4}
          className={`${FIELD_CLASS} resize-y`}
          placeholder="Ringkasan cerita episode ini..."
          value={form.desc}
          onChange={(e) => setField('desc', e.target.value)}
        />
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="p-spotify">
          Link Episode / Show di Spotify
        </label>
        <input
          id="p-spotify"
          type="url"
          className={FIELD_CLASS}
          placeholder="https://open.spotify.com/episode/..."
          value={form.spotifyLink}
          onChange={(e) => setField('spotifyLink', e.target.value)}
        />
        {!linkValid ? (
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-rose-600">
            <Link2Off size={12} /> Bukan link Spotify yang valid (episode/show/track).
          </p>
        ) : (
          <p className="mt-1 text-xs font-medium text-slate-500">
            Tempel link episode (…/episode/…) atau show (…/show/…) dari Spotify — pemutar di halaman
            publik otomatis mengikuti link ini.
          </p>
        )}
        {linkValid && form.spotifyLink && (
          <div className="mt-2 overflow-hidden rounded-xl border-2 border-slate-900">
            <iframe
              title="Preview embed Spotify"
              src={toSpotifyEmbed(form.spotifyLink)}
              width="100%"
              height={form.spotifyLink.includes('/track/') ? 152 : 352}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </FormModalShell>
  );
}

/* ============ Halaman Admin ============ */
export default function Admin() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('chikago_admin') === '1');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState('anggota');
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activities, setActivities] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [memberModal, setMemberModal] = useState(null);
  const [activityModal, setActivityModal] = useState(null);
  const [podcastModal, setPodcastModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (message, type = 'success') => setToast({ message, type });

  const loadData = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    try {
      const [m, r, a, p] = await Promise.all([
        apiService.getMembers(),
        apiService.getRequests(),
        apiService.getActivities(),
        apiService.getPodcasts(),
      ]);
      setMembers(m);
      setRequests(r);
      setActivities(a);
      setEpisodes(p);
    } catch {
      notify('Gagal memuat data. Pastikan backend berjalan.', 'error');
    } finally {
      setLoading(false);
    }
  }, [authed]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ----- Autentikasi ----- */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      await apiService.login(password);
      sessionStorage.setItem('chikago_admin', '1');
      setAuthed(true);
      setPassword('');
    } catch (err) {
      setLoginError(err.message || 'Password salah. Coba lagi.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('chikago_admin');
    setAuthed(false);
    setTab('anggota');
  };

  /* ----- CRUD Member ----- */
  const openAddMember = () => setMemberModal({ ...EMPTY_MEMBER });
  const openEditMember = (m) =>
    setMemberModal({
      ...m,
      laguSpotify: m.laguSpotify || '',
      // Normalisasi pengaturan bingkai foto (member lama belum punya field ini)
      fotoZoom: Number.isFinite(Number(m.fotoZoom)) ? Number(m.fotoZoom) : FOTO_FRAME_DEFAULTS.fotoZoom,
      fotoPosX: Number.isFinite(Number(m.fotoPosX)) ? Number(m.fotoPosX) : FOTO_FRAME_DEFAULTS.fotoPosX,
      fotoPosY: Number.isFinite(Number(m.fotoPosY)) ? Number(m.fotoPosY) : FOTO_FRAME_DEFAULTS.fotoPosY,
    });

  const saveMember = async (form) => {
    if (form.laguSpotify && !isSpotifyUrl(form.laguSpotify)) {
      notify('Link Lagu Spotify tidak valid.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await apiService.updateMember(form.id, form);
        notify(`Biodata ${form.nama} berhasil diperbarui.`);
      } else {
        await apiService.addMember(form);
        notify(`${form.nama} berhasil ditambahkan sebagai anggota.`);
      }
      setMemberModal(null);
      await loadData();
    } catch (err) {
      notify(err.message || 'Gagal menyimpan anggota.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (m) => {
    if (!window.confirm(`Hapus data anggota "${m.nama}"?`)) return;
    try {
      await apiService.deleteMember(m.id);
      notify(`Anggota ${m.nama} berhasil dihapus.`);
      await loadData();
    } catch (err) {
      notify(err.message || 'Gagal menghapus anggota.', 'error');
    }
  };

  /* ----- CRUD Aktivitas ----- */
  const openAddActivity = () => setActivityModal({ ...EMPTY_ACTIVITY });
  const openEditActivity = (a) =>
    setActivityModal({ ...a, photos: (a.photos || []).join('\n') });

  const saveActivity = async (form) => {
    if (!form.title.trim()) {
      notify('Nama aktivitas wajib diisi.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await apiService.updateActivity(form.id, form);
        notify(`Aktivitas "${form.title}" berhasil diperbarui.`);
      } else {
        await apiService.addActivity(form);
        notify(`Aktivitas "${form.title}" berhasil ditambahkan.`);
      }
      setActivityModal(null);
      await loadData();
    } catch (err) {
      notify(err.message || 'Gagal menyimpan aktivitas.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteActivity = async (a) => {
    if (!window.confirm(`Hapus aktivitas "${a.title}" beserta ${a.photos.length} fotonya?`)) return;
    try {
      await apiService.deleteActivity(a.id);
      notify(`Aktivitas "${a.title}" berhasil dihapus.`);
      await loadData();
    } catch (err) {
      notify(err.message || 'Gagal menghapus aktivitas.', 'error');
    }
  };

  /* ----- CRUD Podcast ----- */
  const openAddPodcast = () => setPodcastModal({ ...EMPTY_PODCAST });
  const openEditPodcast = (ep) => setPodcastModal({ ...ep });

  const savePodcast = async (form) => {
    if (!form.title.trim()) {
      notify('Judul episode wajib diisi.', 'error');
      return;
    }
    if (form.spotifyLink && !isSpotifyUrl(form.spotifyLink)) {
      notify('Link Spotify tidak valid.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await apiService.updatePodcast(form.id, form);
        notify(`Episode ${form.no} berhasil diperbarui.`);
      } else {
        await apiService.addPodcast(form);
        notify(`Episode "${form.title}" berhasil ditambahkan.`);
      }
      setPodcastModal(null);
      await loadData();
    } catch (err) {
      notify(err.message || 'Gagal menyimpan episode.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deletePodcast = async (ep) => {
    if (!window.confirm(`Hapus Episode ${ep.no} - "${ep.title}"?`)) return;
    try {
      await apiService.deletePodcast(ep.id);
      notify(`Episode ${ep.no} berhasil dihapus.`);
      await loadData();
    } catch (err) {
      notify(err.message || 'Gagal menghapus episode.', 'error');
    }
  };

  /* ----- Kurasi Usulan ----- */
  const toggleStatus = async (r) => {
    const next = r.status === 'selesai' ? 'baru' : 'selesai';
    try {
      await apiService.setRequestStatus(r.id, next);
      await loadData();
      notify(next === 'selesai' ? 'Usulan ditandai selesai.' : 'Status usulan dibuka kembali.');
    } catch (err) {
      notify(err.message || 'Gagal memperbarui status.', 'error');
    }
  };

  const deleteRequest = async (r) => {
    if (!window.confirm(`Hapus usulan topik dari "${r.nama}"?`)) return;
    try {
      await apiService.deleteRequest(r.id);
      notify('Usulan topik berhasil dihapus.');
      await loadData();
    } catch (err) {
      notify(err.message || 'Gagal menghapus usulan.', 'error');
    }
  };

  /* ----- Modal login (Pixel/Neo-brutalist Style) ----- */
  if (!authed) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24">
        <div className="w-full animate-fade-up rounded-2xl border-2 border-slate-900 bg-white p-8 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border-2 border-slate-900 bg-brand-pink text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <LockKeyhole size={24} />
          </span>
          <h1 className="mt-5 text-center text-2xl font-extrabold text-slate-900">
            Dashboard Admin
          </h1>
          <p className="mt-2 text-center text-sm font-medium text-slate-600">
            Masukkan password admin Chikago untuk melanjutkan.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-pass" className={LABEL_CLASS}>
                Password Admin
              </label>
              <input
                id="admin-pass"
                type="password"
                autoFocus
                className={FIELD_CLASS}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError('');
                }}
              />
            </div>
            {loginError && (
              <p className="rounded-xl border-2 border-rose-900 bg-rose-100 px-4 py-2.5 text-xs font-bold text-rose-900">
                {loginError}
              </p>
            )}
            <button
              type="submit"
              disabled={loggingIn}
              className="btn-pixel bg-brand-pink text-slate-900 w-full py-3 text-sm"
            >
              {loggingIn ? <Loader2 size={16} className="animate-spin" /> : <LockKeyhole size={16} />}
              Masuk
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-5 w-full text-center text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900"
          >
            ← Kembali ke beranda
          </button>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'anggota', label: 'Kelola Anggota', icon: Users, count: members.length },
    { id: 'aktivitas', label: 'Kelola Aktivitas', icon: Camera, count: activities.length },
    { id: 'podcast', label: 'Kelola Podcast', icon: PodcastIcon, count: episodes.length },
    {
      id: 'usulan',
      label: 'Kurasi Usulan',
      icon: Inbox,
      count: requests.filter((r) => r.status !== 'selesai').length,
    },
  ];

  /* ----- Dashboard ----- */
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header dashboard */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-brand-pink">Admin Area</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Dashboard Chikago</h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="btn-pixel bg-rose-400 text-slate-950 px-5 py-2.5 text-xs"
        >
          <LogOut size={16} /> Keluar Admin
        </button>
      </div>

      {/* Tabs Pixel Style */}
      <div className="mt-8 flex flex-wrap gap-3">
        {TABS.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`btn-pixel px-5 py-2.5 text-xs ${
              tab === id ? 'bg-brand-pink text-slate-900' : 'bg-white text-slate-700'
            }`}
          >
            <Icon size={16} /> {label}
            <span className="rounded-md border border-slate-900 bg-slate-100 px-1.5 py-0.5 text-[10px] font-black">
              {count}
            </span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-10 flex items-center justify-center gap-3 text-slate-500 font-bold">
          <Loader2 size={20} className="animate-spin text-brand-pink" /> Memuat data...
        </div>
      )}

      {/* ============ TAB KELOLA ANGGOTA ============ */}
      {!loading && tab === 'anggota' && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900">Daftar Anggota ({members.length})</h2>
            <button
              type="button"
              onClick={openAddMember}
              className="btn-pixel bg-brand-pink text-slate-900 px-4 py-2 text-xs"
            >
              <Plus size={16} /> Tambah Member
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b-2 border-slate-900 bg-slate-100 text-xs font-black uppercase text-slate-900">
                  <tr>
                    <th className="px-4 py-3">Anggota</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Lagu Kesukaan (Spotify)</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-900/10">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-slate-900 bg-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                            <img
                              src={m.foto}
                              alt={m.nama}
                              style={fotoFrameStyle(m)}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{m.nama}</p>
                            <p className="text-xs font-semibold text-slate-400">#{m.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-lg border-2 border-slate-900 bg-brand-pink/30 px-2.5 py-1 text-xs font-black text-slate-900">
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isSpotifyUrl(m.laguSpotify) ? (
                          <a
                            href={m.laguSpotify}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-[#1DB954] hover:underline"
                          >
                            <Music size={12} /> Lihat di Spotify <ExternalLink size={11} />
                          </a>
                        ) : m.lagu?.judul ? (
                          <span className="font-semibold text-slate-600">
                            {m.lagu.judul} — {m.lagu.artis}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-400">
                            <Link2Off size={12} /> Belum diisi
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditMember(m)}
                            className="btn-pixel bg-white p-2 hover:bg-slate-100"
                            aria-label={`Edit ${m.nama}`}
                          >
                            <Pencil size={14} className="text-slate-900" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMember(m)}
                            className="btn-pixel bg-rose-400 p-2 text-slate-950"
                            aria-label={`Hapus ${m.nama}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ============ TAB KELOLA AKTIVITAS ============ */}
      {!loading && tab === 'aktivitas' && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900">
              Daftar Aktivitas ({activities.length})
            </h2>
            <button
              type="button"
              onClick={openAddActivity}
              className="btn-pixel bg-brand-pink text-slate-900 px-4 py-2 text-xs"
            >
              <Plus size={16} /> Tambah Aktivitas
            </button>
          </div>

          {/* Datalist kategori dari data (saran otomatis saat mengisi form) */}
          <datalist id="kategori-aktivitas">
            {[...new Set(activities.map((a) => a.category).filter(Boolean))].map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>

          {activities.length === 0 ? (
            <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-900 bg-white p-10 text-center text-sm font-bold text-slate-500">
              Belum ada aktivitas. Klik “Tambah Aktivitas” untuk membuat galeri baru.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activities.map((a) => (
                <article
                  key={a.id}
                  className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                >
                  <div className="relative aspect-[4/3] border-b-2 border-slate-900 bg-slate-100">
                    {a.photos[0] ? (
                      <img
                        src={a.photos[0]}
                        alt={a.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageOff size={30} className="text-slate-400" />
                      </div>
                    )}
                    <span className="absolute right-2 top-2 rounded-lg border-2 border-slate-900 bg-white px-2 py-0.5 text-[10px] font-black text-slate-900">
                      {a.photos.length} Foto
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="font-extrabold text-slate-900">{a.title}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 rounded-lg border-2 border-slate-900 bg-brand-pink/40 px-2 py-0.5 text-[10px] font-black uppercase text-slate-900">
                      <Camera size={10} /> {a.category}
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-600">
                      {a.desc || 'Tidak ada deskripsi.'}
                    </p>
                    <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => openEditActivity(a)}
                        className="btn-pixel bg-white px-3 py-1.5 text-xs hover:bg-slate-100"
                      >
                        <Pencil size={12} className="text-slate-900" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteActivity(a)}
                        className="btn-pixel bg-rose-400 px-3 py-1.5 text-xs text-slate-950"
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ============ TAB KELOLA PODCAST ============ */}
      {!loading && tab === 'podcast' && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900">
              Daftar Episode Podcast ({episodes.length})
            </h2>
            <button
              type="button"
              onClick={openAddPodcast}
              className="btn-pixel bg-[#1DB954] text-slate-950 px-4 py-2 text-xs"
            >
              <Plus size={16} /> Tambah Episode
            </button>
          </div>

          {episodes.length === 0 ? (
            <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-900 bg-white p-10 text-center text-sm font-bold text-slate-500">
              Belum ada episode. Klik “Tambah Episode” untuk membuat episode baru.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {episodes.map((ep) => (
                <article
                  key={ep.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                >
                  <span className="btn-pixel h-10 w-10 shrink-0 bg-[#1DB954] p-0 text-sm flex items-center justify-center text-slate-950 hover:translate-y-0 hover:shadow-[0_6px_0_0_#0f172a]">
                    {ep.no}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold text-slate-900">{ep.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-500">
                      {ep.desc || 'Tidak ada deskripsi.'}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase">
                      {ep.duration && (
                        <span className="rounded-md border border-slate-900 bg-slate-100 px-1.5 py-0.5 text-slate-700">
                          {ep.duration}
                        </span>
                      )}
                      {isSpotifyUrl(ep.spotifyLink) ? (
                        <a
                          href={ep.spotifyLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#1DB954] hover:underline"
                        >
                          <ExternalLink size={10} /> Link Spotify valid
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Link2Off size={10} /> Link Spotify belum diisi
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditPodcast(ep)}
                      className="btn-pixel bg-white px-3 py-1.5 text-xs hover:bg-slate-100"
                    >
                      <Pencil size={12} className="text-slate-900" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePodcast(ep)}
                      className="btn-pixel bg-rose-400 px-3 py-1.5 text-xs text-slate-950"
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ============ TAB KURASI USULAN ============ */}
      {!loading && tab === 'usulan' && (
        <section className="mt-8">
          <h2 className="text-xl font-extrabold text-slate-900">
            Usulan Topik Podcast ({requests.length})
          </h2>

          {requests.length === 0 && (
            <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-900 bg-white p-10 text-center text-sm font-bold text-slate-500">
              Belum ada usulan topik masuk.
            </div>
          )}

          <div className="mt-4 space-y-4">
            {requests.map((r) => (
              <article
                key={r.id}
                className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-extrabold text-slate-900">{r.nama}</p>
                  {r.kontak && <p className="text-xs font-semibold text-slate-500">({r.kontak})</p>}
                  <span
                    className={`ml-auto rounded-lg border-2 border-slate-900 px-2.5 py-1 text-xs font-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                      r.status === 'selesai'
                        ? 'bg-[#1DB954] text-slate-950'
                        : 'bg-amber-300 text-slate-950'
                    }`}
                  >
                    {r.status === 'selesai' ? 'Selesai' : 'Baru'}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm font-medium text-slate-700">{r.cerita}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                  <p className="mr-auto text-xs font-semibold text-slate-400">
                    Masuk: {new Date(r.createdAt).toLocaleString('id-ID')}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleStatus(r)}
                    className={`btn-pixel text-xs px-3 py-1.5 ${
                      r.status === 'selesai'
                        ? 'bg-slate-200 text-slate-900'
                        : 'bg-[#1DB954] text-slate-950'
                    }`}
                  >
                    {r.status === 'selesai' ? (
                      <>
                        <RotateCcw size={14} /> Buka Lagi
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} /> Tandai Selesai
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRequest(r)}
                    className="btn-pixel bg-rose-400 text-slate-950 text-xs px-3 py-1.5"
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Modal form */}
      {memberModal && (
        <MemberFormModal
          initial={memberModal}
          saving={saving}
          onSave={saveMember}
          onClose={() => setMemberModal(null)}
        />
      )}
      {activityModal && (
        <ActivityFormModal
          initial={activityModal}
          saving={saving}
          onSave={saveActivity}
          onClose={() => setActivityModal(null)}
        />
      )}
      {podcastModal && (
        <PodcastFormModal
          initial={podcastModal}
          saving={saving}
          onSave={savePodcast}
          onClose={() => setPodcastModal(null)}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
