import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import AdminDashboard from '../components/admin/AdminDashboard';
import VenueManagement from '../components/admin/VenueManagement';
import UserManagement from '../components/admin/UserManagement';
import SystemSettings from '../components/admin/SystemSettings';
import Reports from '../components/admin/Reports';
import Finance from '../components/admin/Finance';
import StaffPortal from '../components/StaffPortal';

import AuditLogViewer from '../components/staff/AuditLogViewer';

const AdminPage = () => {
    const { currentUser, login, logout } = useData();
    const { language, toggleLanguage, t } = useLanguage();
    const [loginUser, setLoginUser] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');

    if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'staff') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a1a', color: 'white', textAlign: 'center', gap: '20px' }}>
                <h2 style={{ color: '#F44336' }}>Access Denied</h2>
                <p>Customers cannot access the management portal.</p>
                <button onClick={logout} className="btn btn-primary">Logout and return to Home</button>
            </div>
        );
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        const user = await login(loginUser, loginPass);
        if (user) {
            if (user.role !== 'admin' && user.role !== 'staff') {
                alert('Access Denied: Customers cannot access the management portal.');
                logout(); // Immediately logout if not admin/staff
            }
        } else {
            alert('Invalid Credentials');
        }
    };

    if (!currentUser) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a1a', color: 'white' }}>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '30px', background: '#2a2a2a', borderRadius: '10px', width: '300px' }}>
                    <h2 style={{ textAlign: 'center' }}>Portal Login</h2>
                    <input
                        type="text"
                        placeholder="Username"
                        value={loginUser}
                        onChange={e => setLoginUser(e.target.value)}
                        style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={loginPass}
                        onChange={e => setLoginPass(e.target.value)}
                        style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>Login</button>
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#888' }}>
                        <p>Credentials:</p>
                        <p>Admin: admin / admin</p>
                        <p>Staff: staff / staff</p>
                    </div>
                </form>
            </div>
        );
    }

    // Role-based Layout Switch
    if (currentUser.role === 'staff') {
        return <StaffPortal />;
    }

    // Admin Sidebar Navigation
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'venues', label: 'Venues & Rooms', icon: '🏢' },
        { id: 'users', label: 'Staff Users', icon: '👥' },
        { id: 'audit', label: 'Audit Logs', icon: '📋' },
        { id: 'reports', label: 'Reports', icon: '📈' },
        { id: 'finance', label: 'Finance', icon: '💰' },
        { id: 'settings', label: 'Settings', icon: '⚙️' }
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#121212', color: 'white' }}>
            {/* Sidebar */}
            <aside className="w-64 bg-[#1a1a24] p-5 flex flex-col border-r border-white/5">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-baseline">
                            <span className="text-2xl font-black tracking-tighter text-[#eb79b2] drop-shadow-[0_0_8px_rgba(175,175,175,0.3)]">UB</span>
                            <span className="text-2xl font-black tracking-tighter ml-1 logo-text-animated">KARAOKE</span>
                        </div>
                        <div className="w-2 h-2 rounded-full logo-dot-animated"></div>
                    </div>
                    <button
                        onClick={toggleLanguage}
                        className="h-8 px-3 text-xs font-bold rounded-full border border-[#b000ff] text-[#eb79b2] bg-transparent hover:bg-[#b000ff]/10 transition-all uppercase"
                    >
                        {language.toUpperCase()}
                    </button>
                </div>

                <nav className="flex-1">
                    <ul className="list-none p-0">
                        {navItems.map(item => (
                            <li key={item.id} className="mb-2">
                                <button
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border-none cursor-pointer flex items-center gap-3 text-base transition-all ${activeTab === item.id
                                            ? 'bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold shadow-[0_0_15px_rgba(176,0,255,0.3)]'
                                            : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-[#b000ff]'
                                        }`}
                                >
                                    <span>{item.icon}</span> {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="border-t border-white/10 pt-5">
                    <p className="m-0 mb-3 text-sm text-gray-400">Logged in as: <br /><strong className="text-white">{currentUser.name}</strong></p>
                    <button
                        onClick={logout}
                        className="w-full h-10 px-4 border border-[#b000ff] text-[#b000ff] bg-transparent rounded-lg hover:bg-[#b000ff]/10 hover:text-[#eb79b2] transition-all font-bold text-sm mb-3"
                    >
                        Logout
                    </button>
                    <a href="/" className="block text-center text-gray-500 no-underline text-xs hover:text-[#b000ff] transition-colors">View Public Site</a>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                {activeTab === 'dashboard' && <AdminDashboard />}
                {activeTab === 'venues' && <VenueManagement />}
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'audit' && <AuditLogViewer />}
                {activeTab === 'reports' && <Reports />}
                {activeTab === 'finance' && <Finance />}
                {activeTab === 'settings' && <SystemSettings />}
            </main>
        </div>
    );
};

export default AdminPage;
