import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Activity from './pages/Activity.jsx';
import Podcast from './pages/Podcast.jsx';
import Admin from './pages/Admin.jsx';

/** Scroll ke atas setiap kali route berubah */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    // bg-slate-50 diganti ke bg-transparent biar warna kuning body kelihatan penuh
    <div className="flex min-h-screen flex-col bg-transparent text-slate-800">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/aktivitas" element={<Activity />} />
          <Route path="/podcast" element={<Podcast />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="*"
            element={
              <div className="mx-auto max-w-3xl px-4 py-24 text-center">
                <h1 className="text-3xl font-extrabold text-slate-900">404 — Halaman tidak ditemukan</h1>
                <p className="mt-3 text-slate-600">Halaman yang kamu cari tidak ada.</p>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}