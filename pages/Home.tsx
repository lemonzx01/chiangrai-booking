
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { MOCK_HOTELS } from '../constants';

const Home = () => {
  return (
    <div className="space-y-16 md:space-y-24 pb-24 overflow-hidden">
      <section className="relative min-h-[90vh] md:h-screen flex items-center justify-center pt-24 px-6">
        <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1600" className="absolute inset-0 w-full h-full object-cover brightness-[0.7]" alt="Hero" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#fafbfc]"></div>
        
        <div className="relative z-10 text-center text-white w-full max-w-5xl">
          <div className="inline-flex items-center gap-2 bg-indigo-600/90 backdrop-blur-md px-4 py-2 rounded-full mb-8 animate-fade-in shadow-xl border border-white/20">
            <Star size={12} className="text-amber-300 fill-amber-300" />
            <span className="text-[10px] md:text-[11px] font-black tracking-[0.15em] uppercase">Premium Car & Pool Villa Deals</span>
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black mb-8 leading-[1.1] tracking-tighter animate-slide-up drop-shadow-2xl">
            ขับรถเที่ยวเอง <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-indigo-200 to-white">พร้อมดิวลับจากเรา</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/80 font-medium mb-12 max-w-2xl mx-auto leading-relaxed opacity-90 animate-slide-up animation-delay-300">
            จองรถพรีเมียมพ่วงที่พักดิวพิเศษที่คุณหาไม่ได้จากที่ไหน คัดสรรความคุ้มค่ามาให้ถึงมือคุณ
          </p>
          <SearchBar />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-24 md:space-y-32">
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-6">
            <div className="max-w-xl">
              <div className="h-1.5 w-12 bg-indigo-600 mb-5 rounded-full"></div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight">ดีลสุดคุ้มประจำสัปดาห์</h2>
              <p className="text-slate-500 text-base font-medium">คัดสรรแพ็คเกจรถเช่าพร้อมที่พักพรีเมียมในราคาที่ดีที่สุด</p>
            </div>
            <Link to="/hotels" className="inline-flex items-center gap-2.5 text-indigo-600 font-black hover:translate-x-2 transition-all group px-6 py-3 bg-indigo-50 rounded-2xl text-sm">
              ดูดีลทั้งหมด <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {MOCK_HOTELS.map((item) => (
              <Link to={`/hotels/${item.id}`} key={item.id} className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={item.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt={item.name} />
                  <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-xl">
                    <Star size={14} className="text-amber-400 fill-amber-400" /> {item.star_rating}.0
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <h3 className="font-black text-xl text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{item.name}</h3>
                  <p className="text-slate-500 text-sm mb-8 font-medium line-clamp-2">{item.description}</p>
                  <div className="mt-auto flex justify-between items-center pt-6 border-t border-slate-50">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Package Start</span>
                      <p className="font-black text-2xl text-slate-900 tracking-tight">฿{item.price_per_night.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
