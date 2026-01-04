import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, currentUser } = useData();

    // Redirect if already logged in
    React.useEffect(() => {
        if (currentUser && ['sysadmin', 'admin'].includes(currentUser.role)) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Login without Org Code (Sysadmin flow)
            const user = await login(identifier, password, null);
            if (user) {
                if (user.role === 'sysadmin' || user.role === 'admin') {
                    navigate('/dashboard');
                } else {
                    setError('Access Denied. System Administrators only.');
                }
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-[#b000ff]/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-[#eb79b2]/10 rounded-full blur-[100px] pointer-events-none"></div>
            </div>

            <div className="w-full max-w-md z-10">
                <div className="bg-[#0f0f12] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
                    <div className="text-center mb-8">
                        <div className="flex justify-center items-center gap-2 mb-2">
                            <span className="text-3xl font-black tracking-tighter text-white">SYSTEM</span>
                            <span className="text-3xl font-black tracking-tighter text-[#b000ff]">ADMIN</span>
                        </div>
                        <p className="text-gray-500 text-sm">UB Karaoke Platform Control</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Username</label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Username"
                                className="w-full h-12 px-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-12 px-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full h-12 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <a href="/" className="text-gray-600 text-xs hover:text-[#b000ff] transition-colors">Return to PUBLIC WEBSITE</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
