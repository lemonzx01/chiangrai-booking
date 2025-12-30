import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { MOCK_HOTELS } from '../lib/constants';
import { useTranslation } from 'react-i18next';
import { useLz } from '../lib/localize';

const Booking = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const lz = useLz();

  // Note: This is a simplified booking page using a mock hotel.
  // In a real app, you'd get the selected item from URL params or context.
  const bookingItem = MOCK_HOTELS[0];

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/success');
    }, 1500);
  };

  return (
    <div className="pt-32 md:pt-40 pb-24 max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2 space-y-12">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-600 text-white rounded-[1.25rem] flex items-center justify-center text-2xl font-black shadow-xl">1</div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900">
              {t('booking.yourInfo', 'ระบุข้อมูลของคุณ')}
            </h1>
          </div>

          <form onSubmit={handleBooking} className="space-y-10">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
                    {t('booking.form.fullName', 'Full Name')}
                  </label>
                  <input required type="text" placeholder={t('booking.form.fullNamePlaceholder', 'ระบุชื่อจริง-นามสกุล')} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-base" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
                    {t('booking.form.email', 'Email Address')}
                  </label>
                  <input required type="email" placeholder="example@email.com" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-base" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
                    {t('booking.form.phone', 'Phone Number')}
                  </label>
                  <input required type="tel" placeholder="08x-xxx-xxxx" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-base" />
                </div>
              </div>
            </div>

            <button disabled={loading} className="w-full bg-indigo-600 text-white py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] font-black text-2xl hover:bg-slate-950 transition-all flex items-center justify-center gap-5 active:scale-[0.98] shadow-2xl">
              {loading ? (
                <div className="w-8 h-8 border-[6px] border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                t('booking.confirmButton', 'ยืนยันการจองแพ็คเกจ')
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl sticky top-32">
            <h3 className="text-xl font-black mb-8 tracking-tight text-slate-900 flex items-center justify-between">
              {t('booking.summary.title', 'Order Summary')} <ShoppingBag size={20} className="text-indigo-600" />
            </h3>
            <div className="flex gap-5 mb-10 items-center">
              <img src={bookingItem.images[0]} className="w-20 h-20 object-cover rounded-2xl shadow-lg" alt={lz(bookingItem.name)} />
              <div>
                <h4 className="font-black text-base leading-tight text-slate-900">{lz(bookingItem.name)}</h4>
                <p className="text-indigo-600 text-[10px] font-black uppercase mt-2 tracking-widest">{lz(bookingItem.room_type)}</p>
              </div>
            </div>

            <div className="space-y-6 bg-slate-50 p-8 rounded-[1.5rem] border border-slate-100">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <span className="font-bold text-slate-400 text-sm uppercase">{t('booking.summary.fee', 'Booking Fee')}</span>
                <span className="font-bold text-slate-900">{t('booking.summary.included', 'Included')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-900 text-sm uppercase">{t('booking.summary.total', 'Grand Total')}</span>
                <span className="font-black text-3xl text-indigo-600 tracking-tighter">฿{bookingItem.price_per_night.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
