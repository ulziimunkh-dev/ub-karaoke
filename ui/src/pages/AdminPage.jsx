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
            <aside style={{ width: '250px', background: '#1a1a1a', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ margin: 0, color: '#ff0066' }}>UB Karaoke</h2>
                    <button
                        onClick={toggleLanguage}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                    >
                        {language.toUpperCase()}
                    </button>
                </div>

                <nav style={{ flex: 1 }}>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {navItems.map(item => (
                            <li key={item.id} style={{ marginBottom: '10px' }}>
                                <button
                                    onClick={() => setActiveTab(item.id)}
                                    style={{
                                        width: '100%', textAlign: 'left', padding: '12px', borderRadius: '8px', border: 'none',
                                        background: activeTab === item.id ? '#333' : 'transparent',
                                        color: activeTab === item.id ? 'white' : '#aaa',
                                        cursor: 'pointer', display: 'flex', gap: '10px', fontSize: '1rem'
                                    }}
                                >
                                    <span>{item.icon}</span> {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div style={{ borderTop: '1px solid #333', paddingTop: '20px' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>Logged in as: <br /><strong>{currentUser.name}</strong></p>
                    <button onClick={logout} className="btn btn-outline btn-sm" style={{ width: '100%' }}>Logout</button>
                    <a href="/" style={{ display: 'block', textAlign: 'center', marginTop: '15px', color: '#888', textDecoration: 'none', fontSize: '0.85rem' }}>View Public Site</a>
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
