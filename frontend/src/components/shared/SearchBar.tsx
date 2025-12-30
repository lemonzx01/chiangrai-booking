
import React, { useState, useMemo } from 'react';
import { MapPin, Calendar, Users, Search, Plus, Minus } from 'lucide-react';

const SearchBar = () => {
  const [searchData, setSearchData] = useState({
    destination: '',
    date: '',
    guests: 2
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const handleSearch = () => {
    alert(`กำลังค้นหาแพ็คเกจที่ ${searchData.destination || 'ทุกที่'} สำหรับ ${searchData.guests} ท่าน`);
  };

  const updateGuests = (val: number) => {
    const newVal = Math.max(1, Math.min(20, searchData.guests + val));
    setSearchData({...searchData, guests: newVal});
  };

  const selectedDate = useMemo(
    () => (searchData.date ? new Date(searchData.date) : null),
    [searchData.date]
  );

  const displayDate = selectedDate
    ? selectedDate.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'เลือกวันเดินทาง';

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: (number | null)[][] = [];
  let dayCounter = 1 - firstDay;
  for (let week = 0; week < 6; week++) {
    const weekDays: (number | null)[] = [];
    for (let i = 0; i < 7; i++) {
      if (dayCounter < 1 || dayCounter > daysInMonth) {
        weekDays.push(null);
      } else {
        weekDays.push(dayCounter);
      }
      dayCounter++;
    }
    weeks.push(weekDays);
  }

  const handleSelectDate = (day: number) => {
    const date = new Date(year, month, day);
    const iso = date.toISOString().slice(0, 10);
    setSearchData({ ...searchData, date: iso });
    setIsCalendarOpen(false);
  };

  const goToPrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
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

      <div
        className="flex-1 flex items-center px-6 py-3.5 md:py-4 hover:bg-slate-50 transition-all group cursor-pointer border-b md:border-b-0 border-slate-50 relative"
        onClick={() => setIsCalendarOpen((open) => !open)}
      >
        <Calendar size={20} className="text-indigo-600 mr-4 shrink-0 group-hover:scale-110 transition-transform" />
        <div className="text-left w-full">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5 md:mb-1">ช่วงเวลา</label>
          <div className={`font-bold text-sm md:text-base ${searchData.date ? 'text-slate-900' : 'text-slate-300'}`}>
            {displayDate}
          </div>
        </div>

        {isCalendarOpen && (
          <div
            className="absolute left-0 top-full mt-3 z-40 w-[320px] rounded-3xl bg-white shadow-2xl border border-slate-100 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 text-sm font-bold"
              >
                ‹
              </button>
              <div className="text-sm font-black text-slate-900 tracking-tight">
                {currentMonth.toLocaleDateString('th-TH', {
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <button
                type="button"
                onClick={goToNextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 text-sm font-bold"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-[11px] font-black text-slate-400 uppercase tracking-[0.18em] mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="text-center py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-sm">
              {weeks.map((week, wi) =>
                week.map((day, di) => {
                  if (!day) {
                    return <div key={`${wi}-${di}`} className="h-9" />;
                  }
                  const isSelected =
                    selectedDate &&
                    selectedDate.getFullYear() === year &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getDate() === day;

                  const isToday = (() => {
                    const today = new Date();
                    return (
                      today.getFullYear() === year &&
                      today.getMonth() === month &&
                      today.getDate() === day
                    );
                  })();

                  return (
                    <button
                      key={`${wi}-${di}-${day}`}
                      type="button"
                      onClick={() => handleSelectDate(day)}
                      className={`h-9 w-9 mx-auto flex items-center justify-center rounded-2xl text-xs font-bold transition-all
                        ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'text-slate-600 hover:bg-slate-50'
                        }
                        ${!isSelected && isToday ? 'ring-1 ring-indigo-200' : ''}
                      `}
                    >
                      {day}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between mt-4 text-[11px] font-bold text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setSearchData({ ...searchData, date: '' });
                  setIsCalendarOpen(false);
                }}
                className="uppercase tracking-[0.18em] hover:text-indigo-600"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const iso = today.toISOString().slice(0, 10);
                  setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSearchData({ ...searchData, date: iso });
                }}
                className="uppercase tracking-[0.18em] hover:text-indigo-600"
              >
                Today
              </button>
            </div>
          </div>
        )}
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

