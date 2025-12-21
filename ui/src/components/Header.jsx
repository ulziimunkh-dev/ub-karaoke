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
        <header className="app-header">
            <div className="container header-content">
                <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
                    <span className="logo-text glow-text">{t('appTitle')}</span>
                    <div className="logo-dot"></div>
                </Link>
                <nav className="nav-actions">
                    <button className="btn btn-outline btn-sm" onClick={toggleLanguage}>
                        {language === 'en' ? 'MN' : 'EN'}
                    </button>

                    {currentUser ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Link to="/profile" className="btn btn-text" style={{ color: 'white', textDecoration: 'none' }}>
                                Hi, {currentUser.name}
                            </Link>
                            <button className="btn btn-sm btn-outline" onClick={handleLogout}>
                                {t('logout')}
                            </button>
                        </div>
                    ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => setIsLoginOpen(true)}>
                            {t('login')}/
                            {t('signUp')}
                        </button>
                    )}
                </nav>
            </div>
            {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
        </header>
    );
};

export default Header;
