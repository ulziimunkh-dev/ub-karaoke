import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import LoginModal from './LoginModal';

const Header = () => {
    const { t, language, toggleLanguage } = useLanguage();
    const { currentUser, logout } = useData();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="sticky top-0 z-50 bg-[#0B0B15] backdrop-blur-md border-b border-white/5 py-4 h-[80px] flex items-center shadow-lg">
            <div className="container mx-auto px-4 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-1.5 no-underline group">
                    <div className="flex items-baseline">
                        <span className="text-3xl font-black tracking-tighter text-[#eb79b2] drop-shadow-[0_0_8px_rgba(175,175,175,0.3)]">UB</span>
                        <span className="text-3xl font-black tracking-tighter ml-1 logo-text-animated">KARAOKE</span>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full logo-dot-animated"></div>
                </Link>
                <nav className="flex items-center gap-4">
                    <button className="h-10 px-6 text-sm font-bold rounded-full border border-[#b000ff] text-[#eb79b2] bg-transparent hover:bg-[#b000ff]/10 hover:shadow-[0_0_15px_rgba(176,0,255,0.4)] transition-all flex items-center uppercase tracking-wide" onClick={toggleLanguage}>
                        {language === 'en' ? 'EN' : 'MN'}
                    </button>

                    {currentUser ? (
                        <div className="flex items-center gap-4">
                            <Link to="/profile" className="text-white font-semibold hover:text-[#eb79b2] transition-colors no-underline">
                                Hi, {currentUser.name}
                            </Link>
                            <button className="h-10 px-4 text-sm font-semibold rounded-full border border-[#b000ff] text-[#eb79b2] hover:bg-[#b000ff]/10 hover:shadow-[0_0_10px_rgba(176,0,255,0.3)] transition-all flex items-center" onClick={handleLogout}>
                                {t('logout')}
                            </button>
                        </div>
                    ) : (
                        <button className="h-10 px-8 text-sm rounded-full bg-neon-purple-pattern text-white font-bold shadow-[0_0_20px_rgba(176,0,255,0.4)] hover:shadow-[0_0_35px_rgba(176,0,255,0.7)] hover:-translate-y-0.5 transition-all flex items-center border border-white/10 uppercase tracking-tighter" onClick={() => setIsLoginOpen(true)}>
                            {t('login')}
                        </button>
                    )}
                </nav>
            </div>
            {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
        </header>
    );
};

export default Header;
