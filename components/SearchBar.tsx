
import React, { useState, useRef } from 'react';
import { MapPin, Calendar, Users, Search, Plus, Minus } from 'lucide-react';

const SearchBar = () => {
  const [searchData, setSearchData] = useState({
    destination: '',
    date: '',
    guests: 2
  });
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    alert(`กำลังค้นหาแพ็คเกจที่ ${searchData.destination || 'ทุกที่'} สำหรับ ${searchData.guests} ท่าน`);
  };

  const updateGuests = (val: number) => {
    const newVal = Math.max(1, Math.min(20, searchData.guests + val));
    setSearchData({...searchData, guests: newVal});
  };

  return (
    <div className="bg-white p-1.5 md:p-2 rounded-3xl md:rounded-full shadow-[0_32px_80px_-16px_rgba(0,0,0,0.4)] flex flex-col md:flex-row gap-1 text-slate-900 max-w-5xl mx-auto border border-white/20 animate-slide-up animation-delay-300">
      <div className="flex-[1.4] flex items-center px-6 py-3.5 md:py-4 hover:bg-slate-50 transition-all rounded-2xl md:rounded-l-full md:rounded-r-none group cursor-pointer border-b md:border-b-0 border-slate-50">
        <MapPin size={20} className="text-indigo-600 mr-4 shrink-0 group-hover:scale-110 transition-transform" />
        <div className="text-left w-full">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5 md:mb-1">จุดหมาย</label>
          <input 
            type="text" 
            value={searchData.destination}
            onChange={(e) => setSearchData({...searchData, destination: e.target.value})}
            placeholder="ไปที่ไหนดี?" 
            className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-sm md:text-base placeholder:text-slate-300 outline-none" 
          />
        </div>
      </div>
      
      <div className="hidden md:block w-px h-10 self-center bg-slate-100"></div>

      <div className="flex-1 flex items-center px-6 py-3.5 md:py-4 hover:bg-slate-50 transition-all group cursor-pointer border-b md:border-b-0 border-slate-50 relative" onClick={() => dateInputRef.current?.showPicker()}>
        <Calendar size={20} className="text-indigo-600 mr-4 shrink-0 group-hover:scale-110 transition-transform" />
        <div className="text-left w-full">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5 md:mb-1">ช่วงเวลา</label>
          <input 
            ref={dateInputRef}
            type="date" 
            value={searchData.date}
            onChange={(e) => setSearchData({...searchData, date: e.target.value})}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className={`font-bold text-sm md:text-base ${searchData.date ? 'text-slate-900' : 'text-slate-300'}`}>
            {searchData.date || 'เลือกวันเดินทาง'}
          </div>
        </div>
      </div>

      <div className="hidden md:block w-px h-10 self-center bg-slate-100"></div>

      <div className="flex-1 flex items-center px-6 py-3.5 md:py-4 hover:bg-slate-50 transition-all group rounded-2xl md:rounded-none">
        <Users size={20} className="text-indigo-600 mr-4 shrink-0" />
        <div className="text-left w-full">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5 md:mb-1">ผู้เข้าพัก</label>
          <div className="flex items-center gap-3">
            <button onClick={() => updateGuests(-1)} className="p-1 hover:bg-indigo-100 bg-indigo-50 rounded-lg transition-colors text-indigo-600">
              <Minus size={14} strokeWidth={3} />
            </button>
            <span className="font-bold text-sm md:text-base min-w-[0.8rem] text-center">{searchData.guests}</span>
            <button onClick={() => updateGuests(1)} className="p-1 hover:bg-indigo-100 bg-indigo-50 rounded-lg transition-colors text-indigo-600">
              <Plus size={14} strokeWidth={3} />
            </button>
            <span className="text-[10px] font-bold text-slate-400 uppercase ml-0.5">ท่าน</span>
          </div>
        </div>
      </div>

      <div className="p-1 md:self-center md:pr-2">
        <button onClick={handleSearch} className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 md:px-10 md:py-3.5 rounded-2xl md:rounded-full font-bold text-base md:text-sm hover:bg-slate-900 transition-all flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.96] whitespace-nowrap">
          <Search size={18} strokeWidth={2.5} />
          <span>ค้นหาแพ็คเกจ</span>
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
