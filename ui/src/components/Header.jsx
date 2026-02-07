import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { api } from '../utils/api';
import LoginModal from './LoginModal';
import NotificationBell from './NotificationBell';

const Header = () => {
    const { t, language, toggleLanguage } = useLanguage();
    const { currentUser, logout } = useData();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        const redirectPath = logout();
        navigate(redirectPath);
    };

    return (
        <header className="sticky top-0 z-50 bg-[#0B0B15] backdrop-blur-md border-b border-white/5 py-4 h-[80px] flex items-center shadow-lg">
            <div className="container mx-auto px-4 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-1.5 no-underline group">
                    <div className="flex items-baseline">
                        <span className="text-2xl md:text-3xl font-black tracking-tighter text-[#eb79b2]">UB</span>
                        <span className="text-2xl md:text-3xl font-black tracking-tighter ml-1 logo-text-animated">KARAOKE</span>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full logo-dot-animated"></div>
                </Link>
                <nav className="flex items-center gap-3 md:gap-6">
                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex gap-6 mr-4">
                        <Link to="/about" className="text-gray-300 hover:text-[#b000ff] font-semibold transition-colors no-underline text-sm uppercase tracking-wide">{t('aboutUs')}</Link>
                        {/* <Link to="/pricing" className="text-gray-300 hover:text-[#b000ff] font-semibold transition-colors no-underline text-sm uppercase tracking-wide">Pricing</Link> */}
                        <Link to="/faq" className="text-gray-300 hover:text-[#b000ff] font-semibold transition-colors no-underline text-sm uppercase tracking-wide">{t('faq')}</Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="relative md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <span className="text-sm">{isMenuOpen ? '✕' : '☰'}</span>
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute right-0 top-10 w-44 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out] origin-top-right z-[100]">
                                <Link
                                    to="/about"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2.5 text-gray-300 hover:bg-white/5 hover:text-[#eb79b2] transition-colors no-underline text-xs font-bold"
                                >
                                    <span>📖</span> {t('aboutUs')}
                                </Link>
                                <Link
                                    to="/faq"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2.5 text-gray-300 hover:bg-white/5 hover:text-[#eb79b2] transition-colors no-underline text-xs font-bold border-t border-white/5"
                                >
                                    <span>❓</span> {t('faq')}
                                </Link>
                                <Link
                                    to="/policy"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2.5 text-gray-300 hover:bg-white/5 hover:text-[#eb79b2] transition-colors no-underline text-xs font-bold border-t border-white/5"
                                >
                                    <span>📜</span> {t('policy')}
                                </Link>
                            </div>
                        )}
                    </div>

                    <button className="h-8 md:h-10 px-2.5 md:px-6 text-[10px] md:text-sm font-bold rounded-full border border-[#b000ff] text-[#eb79b2] bg-transparent hover:bg-[#b000ff]/10 transition-all flex items-center uppercase tracking-wide" onClick={toggleLanguage}>
                        {language === 'en' ? 'EN' : 'MN'}
                    </button>

                    {currentUser ? (
                        <div className="flex items-center gap-2 md:gap-4">
                            <NotificationBell />
                            <Link to="/user/profile" className="flex items-center gap-2 text-white font-semibold hover:text-[#eb79b2] transition-colors no-underline">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center text-white font-bold overflow-hidden border border-white/20">
                                    {currentUser.avatar ? (
                                        <img src={api.getFileUrl(currentUser.avatar)} alt={currentUser.name} className="w-full h-full object-cover" />
                                    ) : (
                                        currentUser.name?.charAt(0)
                                    )}
                                </div>
                                <span className="hidden sm:inline">{currentUser.name?.split(' ')[0]}</span>
                            </Link>
                            <button className="hidden md:flex h-10 px-4 text-sm font-semibold rounded-full border border-[#b000ff] text-[#eb79b2] hover:bg-[#b000ff]/10 hover:shadow-[0_0_10px_rgba(176,0,255,0.3)] transition-all items-center" onClick={handleLogout}>
                                {t('logout')}
                            </button>
                        </div>
                    ) : (
                        <button className="h-8 md:h-10 px-4 md:px-8 text-[10px] md:text-sm rounded-full bg-neon-purple-pattern text-white font-bold shadow-[0_0_20px_rgba(176,0,255,0.4)] transition-all flex items-center border border-white/10 uppercase tracking-tighter" onClick={() => setIsLoginOpen(true)}>
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
