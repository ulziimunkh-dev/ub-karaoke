import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/admin/AdminDashboard';
import ManagerDashboard from '../components/admin/ManagerDashboard';
import VenueManagement from '../components/admin/VenueManagement';
import UserManagement from '../components/admin/UserManagement';
import SystemSettings from '../components/admin/SystemSettings';
import Reports from '../components/admin/Reports';
import Finance from '../components/admin/Finance';
import StaffPortal from '../components/StaffPortal';
import StaffLoginPage from './StaffLoginPage';

import AuditLogViewer from '../components/staff/AuditLogViewer';
import OrganizationManagement from '../components/admin/OrganizationManagement';
import { Dropdown } from 'primereact/dropdown'; // Added missing import

const AdminPage = () => {
    const { currentUser, logout, venues, activeVenueId, setActiveVenueId } = useData();
    const { language, toggleLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');

    console.log('AdminPage render - currentUser:', currentUser);

    if (!currentUser) {
        return <StaffLoginPage />;
    }

    // Security check: Only staff, managers, and sysadmins can access this page
    const isStaffOrAdmin = ['staff', 'manager', 'sysadmin', 'admin'].includes(currentUser.role);

    if (!isStaffOrAdmin) {
        // Logged-in customer trying to access /admin
        console.warn('Unauthorized access to /admin - Redirecting to /');
        setTimeout(() => navigate('/'), 100);
        return <div style={{ color: 'white', padding: '20px' }}>Redirecting to home... (Role: {currentUser.role})</div>;
    }

    // Role-based Layout Switch
    if (currentUser.role === 'staff') {
        return <StaffPortal />;
    }

    // Admin Sidebar Navigation
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        ...(currentUser.role === 'sysadmin' ? [{ id: 'organizations', label: 'Organizations', icon: '🏛️' }] : []),
        { id: 'venues', label: currentUser.role === 'sysadmin' ? 'Venues & Rooms' : 'Branches & Rooms', icon: '🏢' },
        { id: 'pos_view', label: 'Point of Sale', icon: '🖥️' },
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
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center font-bold text-xs">
                            {currentUser.name?.charAt(0)}
                        </div>
                        <div>
                            <p className="m-0 text-xs text-gray-500 uppercase tracking-tighter font-bold">{currentUser.role}</p>
                            <p className="m-0 text-sm font-bold text-white truncate w-32">{currentUser.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full h-10 px-4 border border-[#b000ff] text-[#b000ff] bg-transparent rounded-lg hover:bg-[#b000ff]/10 hover:text-[#eb79b2] transition-all font-bold text-sm mb-3"
                    >
                        Logout
                    </button>
                    <a href="/" className="block text-center text-gray-500 no-underline text-[10px] hover:text-[#b000ff] transition-colors">PUBLIC SITE</a>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                {/* Header Filter Bar - visible for core management tabs */}
                {['pos_view', 'users', 'venues', 'audit'].includes(activeTab) && (
                    <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1a1a24] p-5 rounded-2xl border border-white/5 shadow-2xl">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-bold text-white m-0 uppercase tracking-tight">Management context</h1>
                            <p className="text-xs text-gray-500 font-medium">Filtering data based on selected branch scope</p>
                        </div>
                        <div className="flex items-center gap-4 bg-black/20 p-2 rounded-xl border border-white/5">
                            <span className="hidden lg:inline text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">Switch venue:</span>
                            <Dropdown
                                value={activeVenueId}
                                options={currentUser.role === 'sysadmin'
                                    ? venues.map(v => ({ label: v.name, value: v.id }))
                                    : venues.filter(v => v.organizationId === currentUser.organizationId).map(v => ({ label: v.name, value: v.id }))
                                }
                                onChange={(e) => setActiveVenueId(e.value)}
                                placeholder="Select Branch Context"
                                className="w-64 h-10 bg-black/40 border-white/10 rounded-lg text-sm"
                                filter
                                showClear={currentUser.role === 'sysadmin'}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'dashboard' && (currentUser.role === 'sysadmin' ? <AdminDashboard /> : <ManagerDashboard />)}
                {activeTab === 'organizations' && <OrganizationManagement />}
                {activeTab === 'venues' && <VenueManagement />}
                {activeTab === 'pos_view' && <StaffPortal />}
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
