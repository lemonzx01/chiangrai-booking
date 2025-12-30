import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Compass } from 'lucide-react';
import { NAVIGATION } from '../../lib/constants';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const { t } = useTranslation();
  
  // In HashRouter, location.pathname will be the path after the #
  // Home page should be "/"
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (isAdmin) return null;

  // If it's the home page, make it transparent if not scrolled
  // For other pages, keep it white all the time
  const activeLightMode = scrolled || !isHome;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        activeLightMode ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5 md:py-8'
      }`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className={`p-2 rounded-xl transition-all duration-300 ${
                activeLightMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white/10 text-white backdrop-blur-lg border border-white/20'
              }`}>
                <Compass size={20} strokeWidth={2.5} />
              </div>
              <span className={`text-xl font-extrabold tracking-tight transition-all duration-300 ${
                activeLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                Travel<span className={activeLightMode ? 'text-indigo-600' : 'text-indigo-400'}>Ease</span>
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {NAVIGATION.map((item) => (
                <Link
                  key={item.key}
                  to={item.path}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                    location.pathname === item.path 
                      ? activeLightMode ? 'text-indigo-600 bg-indigo-50/80' : 'text-white bg-white/20'
                      : activeLightMode ? 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50' : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t(`navbar.${item.key}` as any)}
                </Link>
              ))}
              <div className={`w-px h-5 mx-2 ${activeLightMode ? 'bg-slate-200' : 'bg-white/20'}`}></div>
              <LanguageSwitcher light={activeLightMode} />
              <Link to="/hotels" className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 whitespace-nowrap ${
                activeLightMode ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900'
              }`}>
                {t('navbar.bookNow', 'จองตอนนี้')}
              </Link>
            </div>

            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-xl transition-colors"
            >
              {isOpen ? (
                <X size={24} className={activeLightMode ? 'text-slate-900' : 'text-white'} />
              ) : (
                <Menu size={24} className={activeLightMode ? 'text-slate-900' : 'text-white'} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`md:hidden fixed inset-0 bg-white z-40 transition-transform duration-500 ease-in-out ${
          isOpen ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <div className="pt-24 px-8 flex flex-col gap-8">
            {NAVIGATION.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className="text-3xl font-black text-slate-900 hover:text-indigo-600 transition-colors"
              >
                {t(`navbar.${item.key}` as any)}
              </Link>
            ))}
            <div className="mt-4 flex justify-center">
              <LanguageSwitcher light={activeLightMode} />
            </div>
            <Link 
              to="/hotels" 
              className="mt-4 bg-indigo-600 text-white py-6 rounded-3xl font-black text-xl text-center shadow-xl active:scale-95 transition-all"
            >
              {t('navbar.bookPackage', 'จองแพ็คเกจเลย')}
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
