import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

const BottomNav = ({ onSearchClick }) => {
    const { t } = useLanguage();
    const { currentUser } = useData();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#161622]/95 backdrop-blur-xl border-t border-white/5 px-2 py-3 flex justify-around items-center z-[100] safe-area-bottom">
            <Link
                to="/"
                className={`flex flex-col items-center gap-1.5 no-underline transition-all ${isActive('/') ? 'text-[#eb79b2]' : 'text-gray-500'}`}
            >
                <span className="text-2xl">🏠</span>
                <span className="text-[10px] font-black uppercase tracking-tight">{t('home')}</span>
                {isActive('/') && <div className="w-1.5 h-1.5 rounded-full bg-[#eb79b2] mt-0.5 shadow-[0_0_8px_rgba(235,121,178,0.8)]"></div>}
            </Link>

            <button
                onClick={onSearchClick}
                className={`flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer transition-all ${isActive('/search') ? 'text-[#eb79b2]' : 'text-gray-500'}`}
            >
                <span className="text-2xl">🔍</span>
                <span className="text-[10px] font-black uppercase tracking-tight">{t('searchPlaceholder').split(' ')[0]}</span>
            </button>

            <Link
                to="/user/profile"
                className={`flex flex-col items-center gap-1.5 no-underline transition-all ${isActive('/user/profile') ? 'text-[#eb79b2]' : 'text-gray-500'}`}
            >
                <span className="text-2xl">🎤</span>
                <span className="text-[10px] font-black uppercase tracking-tight">{t('myBookings').split(' ')[1] || 'Orders'}</span>
                {isActive('/user/profile') && <div className="w-1.5 h-1.5 rounded-full bg-[#eb79b2] mt-0.5 shadow-[0_0_8px_rgba(235,121,178,0.8)]"></div>}
            </Link>

            <Link
                to="/user/profile"
                className={`flex flex-col items-center gap-1.5 no-underline transition-all ${isActive('/profile-settings') ? 'text-[#eb79b2]' : 'text-gray-500'}`}
            >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center overflow-hidden border border-white/20 shadow-lg shadow-[#b000ff]/20">
                    {currentUser?.avatar ? (
                        <img src={currentUser.avatar} alt="P" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[10px] font-bold text-white">{currentUser?.name?.charAt(0) || 'U'}</span>
                    )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight">{t('profile')}</span>
            </Link>
        </nav>
    );
};

export default BottomNav;
