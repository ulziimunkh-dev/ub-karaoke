import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';

const StaffLoginPage = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [orgCode, setOrgCode] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Modes: 'login', 'setup'
    const [mode, setMode] = useState('login');

    // Load config on mount
    React.useEffect(() => {
        const savedCode = localStorage.getItem('device_org_code');
        if (savedCode) {
            setOrgCode(savedCode);
        }
    }, []);

    const { login, currentUser } = useData();
    const { toggleLanguage, language } = useLanguage();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (currentUser && ['staff', 'manager', 'sysadmin'].includes(currentUser.role)) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // SETUP MODE HANDLER
        if (mode === 'setup') {
            if (orgCode) {
                localStorage.setItem('device_org_code', orgCode.toUpperCase());
                setMessage('Device configured successfully');
                setTimeout(() => {
                    setMode('login');
                    setMessage('');
                }, 1000);
            }
            return;
        }

        // LOGIN MODE HANDLER
        setIsLoading(true);

        try {
            const user = await login(identifier, password, orgCode);
            if (user) {
                if (user.role === 'sysadmin' || user.role === 'manager' || user.role === 'staff') {
                    navigate('/dashboard');
                } else {
                    setError('Access Denied: Only staff and managers can access this portal.');
                }
            } else {
                setError('Invalid credentials.');
            }
        } catch (err) {
            setError('Invalid credentials or network error.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#b000ff]/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#eb79b2]/10 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8 relative">
                        {/* Settings Toggle */}
                        <button
                            onClick={() => setMode(mode === 'login' ? 'setup' : 'login')}
                            className="absolute right-0 top-0 text-white/20 hover:text-white transition-colors"
                            title={mode === 'login' ? "Device Setup" : "Back to Login"}
                        >
                            {mode === 'login' ? '⚙️' : '✕'}
                        </button>

                        <div className="flex justify-center items-center gap-2 mb-4">
                            <span className="text-3xl font-black tracking-tighter text-[#eb79b2]">UB</span>
                            <span className="text-3xl font-black tracking-tighter logo-text-animated">KARAOKE</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {mode === 'login' ? 'Management Portal' : 'Device Configuration'}
                        </h3>
                        <p className="text-gray-400 text-sm">
                            {mode === 'login' ? 'Welcome back, please sign in.' : 'Configure this device for your organization.'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                            <span className="text-lg">⚠️</span>
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400 text-sm">
                            <span>✅</span> {message}
                        </div>
                    )}

                    {/* SETUP MODE - MOBILE BOTTOM SHEET */}
                    {mode === 'setup' && (
                        <div className="fixed inset-0 z-[100] flex flex-col justify-end lg:hidden animate-[fadeIn_0.2s_ease]">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMode('login')}></div>
                            <div className="bg-[#1a1a24] w-full rounded-t-3xl relative p-8 border-t border-white/10 shadow-modal animate-[slideUp_0.3s_ease-out]">
                                <div className="flex justify-center mb-6">
                                    <div className="w-16 h-2 bg-white/20 rounded-full"></div>
                                </div>
                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-bold text-white mb-2">Device Configuration</h3>
                                    <p className="text-gray-400 text-sm">Configure this device for your organization.</p>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-200 text-sm">
                                        <p className="font-bold mb-1 text-xs">ℹ️ One-Time Setup</p>
                                        Enter your Organization Code here. Access to this device will be restricted to this organization.
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Organization Code</label>
                                        <input
                                            type="text"
                                            value={orgCode}
                                            onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                                            placeholder="e.g. UBK-GRP"
                                            className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none text-center font-mono tracking-wider"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                localStorage.removeItem('device_org_code');
                                                setOrgCode('');
                                                setMessage('Configuration cleared');
                                            }}
                                            className="flex-1 h-12 rounded-xl bg-red-500/10 text-red-400 font-bold border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 h-12 bg-[#b000ff] text-white font-bold rounded-xl shadow-[0_0_25px_rgba(176,0,255,0.4)] hover:shadow-[0_0_35px_rgba(176,0,255,0.6)] transition-all flex items-center justify-center gap-2"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {mode === 'setup' ? (
                            // SETUP FORM - DESKTOP ONLY (hidden on mobile via the block above taking precedence)
                            <div className="space-y-6 hidden lg:block">
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-200 text-sm">
                                    <p className="font-bold mb-1">ℹ️ One-Time Setup</p>
                                    Enter your Organization Code here. Access to this device will be restricted to this organization.
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Organization Code</label>
                                    <input
                                        type="text"
                                        value={orgCode}
                                        onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                                        placeholder="e.g. UBK-GRP"
                                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none text-center font-mono tracking-wider"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            localStorage.removeItem('device_org_code');
                                            setOrgCode('');
                                            setMessage('Configuration cleared');
                                        }}
                                        className="flex-1 h-12 rounded-xl bg-red-500/10 text-red-400 font-bold border border-red-500/20 hover:bg-red-500/20 transition-all"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 h-12 bg-[#b000ff] text-white font-bold rounded-xl shadow-[0_0_25px_rgba(176,0,255,0.4)] hover:shadow-[0_0_35px_rgba(176,0,255,0.6)] transition-all"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // LOGIN FORM
                            <>
                                {localStorage.getItem('device_org_code') ? (
                                    <div className="text-center">
                                        <span className="inline-block px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono mb-4">
                                            🔒 Configured for: {localStorage.getItem('device_org_code')}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center mb-4">
                                        <p className="text-yellow-200 text-sm mb-2">⚠️ Device Not Configured</p>
                                        <button
                                            type="button"
                                            onClick={() => setMode('setup')}
                                            className="text-xs font-bold uppercase tracking-wide text-yellow-400 hover:text-white transition-colors underline"
                                        >
                                            Click here to setup Organization
                                        </button>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Username</label>
                                    <input
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="Username"
                                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Password/Pin</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full h-12 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-xl shadow-[0_0_25px_rgba(176,0,255,0.4)] hover:shadow-[0_0_35px_rgba(176,0,255,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? 'Processing...' : 'Secure Login'}
                                </button>
                            </>
                        )}
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                        <button onClick={toggleLanguage} className="hover:text-white transition-colors uppercase font-bold">
                            LANGUAGE: {language === 'en' ? 'ENGLISH' : 'MN'}
                        </button>
                        <a href="/" className="hover:text-white transition-colors uppercase font-bold">Public Website</a>
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default StaffLoginPage;
