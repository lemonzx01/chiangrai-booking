
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Mail, Phone } from 'lucide-react';

const Footer = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-slate-950 text-slate-400 pt-24 pb-16 mt-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent opacity-30"></div>
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 mb-20 text-center sm:text-left">
          <div className="lg:col-span-1">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-8">
              <Compass size={28} className="text-indigo-400" />
              <span className="text-2xl font-black text-white tracking-tight">TravelEase</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto sm:mx-0 font-medium">จองทริปเที่ยวพ่วงรถเช่าพรีเมียม ดิวลับที่คุณหาไม่ได้จากที่ไหน ทุกที่พักเราไปดิวเองกับมือ</p>
          </div>
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8">Menu</h4>
            <ul className="space-y-4 text-sm font-bold tracking-widest uppercase">
              <li><Link to="/hotels" className="hover:text-indigo-400">แพ็คเกจทริป</Link></li>
              <li><Link to="/cars" className="hover:text-indigo-400">รถเช่ารายวัน</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8">Support</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li className="flex justify-center sm:justify-start gap-4 items-center hover:text-white"><Mail size={18} className="text-indigo-500" /> hello@travelease.com</li>
              <li className="flex justify-center sm:justify-start gap-4 items-center hover:text-white"><Phone size={18} className="text-indigo-500" /> +66 2 123 4567</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8">Partner</h4>
            <Link to="/contact" className="inline-block bg-white/5 border border-white/10 px-8 py-3 rounded-xl font-black text-xs uppercase text-white hover:bg-white hover:text-slate-950 transition-all">ร่วมเป็นพาร์ทเนอร์</Link>
          </div>
        </div>
        <div className="pt-12 border-t border-white/5 text-center flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">© 2024 TravelEase Thailand. All Rights Reserved.</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

