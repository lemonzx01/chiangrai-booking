
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const Success = () => (
  <div className="min-h-screen flex items-center justify-center p-8 pt-32 bg-[#fafbfc]">
    <div className="max-w-2xl w-full text-center relative">
      <div className="w-28 h-28 md:w-40 md:h-40 bg-indigo-600 text-white rounded-[3rem] flex items-center justify-center mx-auto mb-12 shadow-3xl animate-bounce-slow border-[10px] border-white">
        <CheckCircle size={56} className="md:w-[72px] md:h-[72px]" strokeWidth={3} />
      </div>
      <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter text-slate-900">จองสำเร็จแล้ว!</h1>
      <p className="text-slate-500 text-xl md:text-2xl mb-16 font-medium px-8 leading-relaxed max-w-xl mx-auto">
        ขอบคุณที่ร่วมเดินทางกับเรา <br/> 
        <span className="text-indigo-600 font-black">ทีมงาน TravelEase จะติดต่อกลับใน 15 นาที</span>
      </p>
      
      <div className="flex flex-col sm:flex-row gap-6 max-w-md mx-auto">
        <Link to="/" className="flex-1 bg-slate-950 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all shadow-2xl active:scale-[0.98]">กลับสู่หน้าหลัก</Link>
        <button onClick={() => window.print()} className="flex-1 bg-white border-2 border-slate-100 py-5 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all shadow-md">พิมพ์ใบจอง</button>
      </div>
    </div>
  </div>
);

export default Success;
