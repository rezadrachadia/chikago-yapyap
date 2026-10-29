import { useState } from 'react';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { apiService } from '../lib/api';

/**
 * Form usulan topik podcast + toast konfirmasi terkirim (Spotify Dark Mode + Pixel Style Button).
 */
export default function RequestForm() {
  const [form, setForm] = useState({ nama: '', kontak: '', cerita: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.cerita.trim()) {
      setError('Nama dan detail topik wajib diisi.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiService.sendRequest(form);
      setSuccess(true);
      setForm({ nama: '', kontak: '', cerita: '' });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.message || 'Gagal mengirim usulan nih. Coba lagi nanti yak.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-slate-900 bg-zinc-900 p-6 text-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] sm:p-8">
      <h3 className="text-xl font-extrabold text-white">Kita Bahas Apa Lagi Ya?</h3>
      <p className="mt-1 text-sm text-zinc-400">
        Kalau kalian punya topik yang mau dibahas di podcast kita, atau cerita yang unik. coba taro aja disini, nanti bakal dikirim ke email
        admin Chikago, biar email ga sepi-sepi banget.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="req-nama" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-300">
              Nama Pengusul *
            </label>
            <input
              id="req-nama"
              name="nama"
              className="w-full rounded-xl border-2 border-slate-900 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[#1DB954] focus:ring-2 focus:ring-[#1DB954]/30"
              placeholder="Contoh : Budi Ayam"
              value={form.nama}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="req-kontak" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-300">
              Kontak (opsional)
            </label>
            <input
              id="req-kontak"
              name="kontak"
              className="w-full rounded-xl border-2 border-slate-900 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[#1DB954] focus:ring-2 focus:ring-[#1DB954]/30"
              placeholder="Email / nomor HP kalian"
              value={form.kontak}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="req-cerita" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-300">
            Topik / Cerita dari kalian *
          </label>
          <textarea
            id="req-cerita"
            name="cerita"
            rows={5}
            className="w-full resize-y rounded-xl border-2 border-slate-900 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[#1DB954] focus:ring-2 focus:ring-[#1DB954]/30"
            placeholder="Kalo kalian ada saran topik yang mau dibahas ape dan juga kalian mau cerita biar kaya ala-ala radio. coba kirimin dulu aja, siapatau admin lagi ga males nanti bisa masuk ke eps kita."
            value={form.cerita}
            onChange={handleChange}
          />
        </div>

        {error && (
          <p className="rounded-xl border border-rose-500/40 bg-rose-500/20 px-4 py-3 text-sm font-semibold text-rose-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-pixel bg-[#1DB954] text-slate-950 px-6 py-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Mengirim...
            </>
          ) : (
            <>
              <Send size={16} /> Kirim Usulan Topik
            </>
          )}
        </button>
      </form>

      {/* Toast konfirmasi sukses */}
      {success && (
        <div
          role="status"
          className="animate-fade-up mt-5 flex items-start gap-3 rounded-xl border-2 border-[#1DB954] bg-[#1DB954]/15 p-4 text-sm text-white"
        >
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[#1DB954]" />
          <div>
            <p className="font-bold text-[#1DB954]">Makasih! Usulan topiknya udah kekirim.</p>
            <p className="mt-0.5 text-xs font-medium text-zinc-300">
              Admin Chikago udah nerima notifnya email, berdoa aja semoga admin ga malas ya.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}