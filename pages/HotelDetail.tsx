
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Info, CheckCircle, ChevronLeft } from 'lucide-react';
import { MOCK_HOTELS } from '../constants';

const HotelDetail = () => {
  const { id } = useParams<{ id: string }>();
  const hotel = MOCK_HOTELS.find((h) => h.id === id);
  const [activeImage, setActiveImage] = useState(hotel?.images[0] || '');

  if (!hotel) {
    return (
      <div className="pt-48 pb-24 text-center min-h-[70vh] flex flex-col items-center justify-center px-6">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-8 text-slate-300">
           <MapPin size={48} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">ไม่พบข้อมูลที่ต้องการ</h1>
        <p className="text-slate-500 mb-10 max-w-xs mx-auto font-medium">ข้อมูลที่คุณค้นหาอาจจะถูกย้ายหรือไม่มีอยู่ในระบบแล้ว</p>
        <Link to="/hotels" className="text-white font-black px-10 py-4 bg-indigo-600 rounded-2xl inline-block transition-all shadow-xl hover:bg-slate-900">กลับไปดูแพ็คเกจอื่น</Link>
      </div>
    );
  }

  return (
    <div className="pt-32 md:pt-40 pb-24 max-w-7xl mx-auto px-6 sm:px-8">
      <Link to="/hotels" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold mb-12 group transition-colors">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> กลับสู่หน้ารายการ
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
        <div className="space-y-8 sticky top-32">
          {/* Main Photo Card */}
          <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-[0_32px_80px_-20px_rgba(0,0,0,0.15)] border border-white relative group bg-slate-100">
            <img 
              src={activeImage} 
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" 
              alt={hotel.name} 
              onLoad={(e) => (e.currentTarget.style.opacity = '1')}
              style={{ opacity: 0 }}
            />
          </div>
          
          {/* Gallery Thumbnails */}
          {hotel.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {hotel.images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(img)}
                  className={`aspect-square rounded-[1.25rem] overflow-hidden shadow-sm border-2 transition-all hover:scale-105 active:scale-95 bg-slate-100 ${
                    activeImage === img ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-lg' : 'border-white opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="mb-10">
            <div className="flex items-center gap-2.5 text-amber-500 mb-6">
              <div className="flex gap-1">
                {[...Array(hotel.star_rating)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
              </div>
              <div className="w-px h-4 bg-slate-200 mx-2"></div>
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Verified Luxury Deal</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tighter">{hotel.name}</h1>
            
            <div className="flex items-center gap-3.5 text-slate-500 font-bold mb-12 text-lg">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shadow-sm">
                <MapPin size={24} />
              </div>
              {hotel.location}
            </div>
            
            <div className="p-10 bg-white rounded-[2.5rem] border border-slate-100 mb-12 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
               <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-6 flex items-center gap-3">
                 <Info size={16} /> Exclusive Experience
               </h3>
               <p className="text-slate-600 font-medium text-xl leading-relaxed relative z-10">{hotel.description}</p>
            </div>

            <div className="space-y-10">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-900 border-b border-slate-100 pb-6">What's Included in this deal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {hotel.amenities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 font-bold text-slate-700 group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50/50 flex items-center justify-center text-indigo-600 border border-indigo-50 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <CheckCircle size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-16 pt-12 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-10">
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Total Package Investment</span>
              <p className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">฿{hotel.price_per_night.toLocaleString()}</p>
            </div>
            <Link to={`/booking?type=package&id=${hotel.id}`} className="w-full sm:w-auto bg-indigo-600 text-white px-14 py-7 rounded-3xl font-black text-xl hover:bg-slate-950 transition-all shadow-[0_20px_50px_-12px_rgba(79,70,229,0.4)] active:scale-[0.98] text-center">
              จองแพ็คเกจตอนนี้
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetail;
