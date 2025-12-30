import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { MOCK_HOTELS } from '../lib/constants';
import { useTranslation } from 'react-i18next';
import { useLocalize } from '../lib/localize';

const Hotels = () => {
  const { t } = useTranslation();
  const localize = useLocalize();

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-6 sm:px-8">
      <div className="text-center mb-16 md:mb-20">
        <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
          {t('hotels.ourPackages', 'Our Packages')}
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter">
          {t('hotels.allPackages', 'แพ็คเกจเที่ยวทั้งหมด')}
        </h1>
        <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto">
          {t('hotels.subtitle', 'ดิวพิเศษรถเช่าพร้อมที่พักพรีเมียมที่คุณหาไม่ได้จากที่ไหน')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
        {MOCK_HOTELS.map((item) => (
          <Link to={`/hotels/${item.id}`} key={item.id} className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img 
                src={item.images[0]} 
                className="w-full h-full object-cover group-hover:scale-110 transition duration-700" 
                alt={localize(item.name)} 
              />
            </div>
            <div className="p-8 flex flex-col flex-1">
              <h3 className="font-black text-2xl text-slate-900 mb-4 leading-tight">
                {localize(item.name)}
              </h3>
              <p className="text-slate-400 text-sm mb-10 flex items-center gap-2 font-bold">
                <MapPin size={18} className="text-indigo-600" /> {localize(item.location)}
              </p>
              <div className="mt-auto flex justify-between items-center pt-8 border-t border-slate-50">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    {t('hotels.totalPrice', 'Total Price')}
                  </span>
                  <p className="font-black text-3xl text-slate-900">
                    ฿{item.price_per_night.toLocaleString()}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-200 group-hover:scale-105 transition-transform">
                  <ArrowRight size={24} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Hotels;