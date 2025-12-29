
import React, { Suspense, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';

// Lazy loading สำหรับหน้าที่เหลือ
const Hotels = React.lazy(() => import('./pages/Hotels'));
const HotelDetail = React.lazy(() => import('./pages/HotelDetail'));
const Cars = React.lazy(() => import('./pages/Cars'));
const Booking = React.lazy(() => import('./pages/Booking'));
const Success = React.lazy(() => import('./pages/Success'));

// คอมโพเนนต์ช่วยเลื่อนขึ้นบนสุดเมื่อเปลี่ยนหน้า
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col selection:bg-indigo-600 selection:text-white bg-[#fafbfc]">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold animate-pulse text-sm uppercase tracking-widest">Loading TravelEase...</p>
              </div>
            </div>
          }>
            <Routes>
              {/* หน้าหลัก */}
              <Route path="/" element={<Home />} />
              
              {/* หน้าอื่นๆ */}
              <Route path="/hotels" element={<Hotels />} />
              <Route path="/hotels/:id" element={<HotelDetail />} />
              <Route path="/cars" element={<Cars />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/success" element={<Success />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* ป้องกันเข้าหน้าอื่นที่ไม่มีอยู่จริงให้ดีดกลับไปหน้าหลัก */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

const ContactPage = () => (
  <div className="pt-48 pb-32 max-w-4xl mx-auto px-8 text-center min-h-[80vh] flex flex-col justify-center">
    <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 mx-auto">Get in touch</div>
    <h1 className="text-6xl md:text-8xl font-black mb-10 tracking-tighter text-slate-950 leading-tight">Partner <br/>With Us</h1>
    <p className="text-slate-500 text-xl md:text-2xl mb-16 font-medium leading-relaxed max-w-2xl mx-auto">ติดต่อทีมงานได้ทันทีเพื่อรับดิวที่ดีที่สุด หรือเสนอพื้นที่พักพ่วงรถเช่าของคุณ</p>
    <div className="flex justify-center">
      <a href="mailto:hello@travelease.com" className="bg-slate-950 text-white px-14 py-6 rounded-[1.5rem] font-black text-xl shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">ส่งอีเมลติดต่อเรา</a>
    </div>
  </div>
);

const AdminLogin = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <div className="bg-white p-12 md:p-16 rounded-[3rem] shadow-2xl max-w-md w-full border border-white">
      <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-xl shadow-indigo-100">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
      </div>
      <h1 className="text-3xl font-black text-center mb-10 tracking-tighter text-slate-900">Partner Access</h1>
      <div className="space-y-6">
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Admin ID</label>
           <input type="email" placeholder="email@travelease.com" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-900 transition-all" />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Password</label>
           <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-900 transition-all" />
        </div>
        <button className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-lg hover:bg-slate-900 transition-all shadow-xl active:scale-[0.98]">เข้าสู่ระบบ</button>
      </div>
    </div>
  </div>
);

export default App;
