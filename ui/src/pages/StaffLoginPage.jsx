import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';

const StaffLoginPage = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, currentUser } = useData();
    const { toggleLanguage, language } = useLanguage();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (currentUser && ['staff', 'manager', 'sysadmin'].includes(currentUser.role)) {
            navigate('/admin');
        }
    }, [currentUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await login(identifier, password);
            if (user) {
                if (user.role === 'sysadmin' || user.role === 'manager' || user.role === 'staff') {
                    navigate('/admin');
                } else {
                    setError('Access Denied: Only staff and managers can access this portal.');
                }
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
                    <div className="text-center mb-8">
                        <div className="flex justify-center items-center gap-2 mb-4">
                            <span className="text-3xl font-black tracking-tighter text-[#eb79b2]">UB</span>
                            <span className="text-3xl font-black tracking-tighter logo-text-animated">KARAOKE</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Management Portal</h3>
                        <p className="text-gray-400 text-sm">Welcome back, please sign in.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                            <span className="text-lg">⚠️</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Identity</label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Username or Phone"
                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Security Key</label>
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
                            className={`w-full h-12 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-xl shadow-[0_0_25px_rgba(176,0,255,0.4)] hover:shadow-[0_0_35px_rgba(176,0,255,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Processing...' : 'Secure Login'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                        <button onClick={toggleLanguage} className="hover:text-white transition-colors uppercase font-bold">
                            LANGUAGE: {language === 'en' ? 'ENGLISH' : 'MN'}
                        </button>
                        <a href="/" className="hover:text-white transition-colors uppercase font-bold">Public Website</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffLoginPage;
