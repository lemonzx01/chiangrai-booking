
import React from 'react';
import { Link } from 'react-router-dom';
import { MOCK_CARS } from '../constants';

const Cars = () => (
  <div className="pt-32 pb-24 max-w-7xl mx-auto px-6 sm:px-8">
     <div className="flex flex-col sm:flex-row justify-between items-center mb-16 gap-8">
      <div>
        <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">Car Rentals</div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tighter">รถเช่ารายวัน</h1>
        <p className="text-slate-500 font-medium text-lg">เลือกขับรถหรูไปสัมผัสทุกที่ที่คุณต้องการ</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
      {MOCK_CARS.map((car) => (
        <div key={car.id} className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="relative lg:w-[45%] aspect-[16/11] lg:aspect-square rounded-3xl overflow-hidden shadow-xl shrink-0">
            <img src={car.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={car.name} />
          </div>
          <div className="lg:w-[55%] flex flex-col py-2">
            <div className="mb-6">
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full uppercase tracking-widest">{car.car_type}</span>
              <h3 className="text-3xl font-black text-slate-900 mt-5 leading-tight tracking-tight">{car.name}</h3>
            </div>
            <p className="text-slate-500 text-base mb-8 font-medium line-clamp-3 leading-relaxed">{car.description}</p>
            <div className="mt-auto flex justify-between items-center pt-8 border-t border-slate-50">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Per Day</span>
                <p className="font-black text-2xl md:text-3xl text-slate-900 tracking-tight">฿{car.price_per_day.toLocaleString()}</p>
              </div>
              <Link to={`/booking?type=car&id=${car.id}`} className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-xl active:scale-95 whitespace-nowrap">จองตอนนี้</Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Cars;
