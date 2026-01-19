import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/admin/AdminDashboard';
import ManagerDashboard from '../components/admin/ManagerDashboard';
import VenueManagement from '../components/admin/VenueManagement';
import UserManagement from '../components/admin/UserManagement';
import StaffManagement from '../components/admin/StaffManagement';
import SystemSettings from '../components/admin/SystemSettings';
import Reports from '../components/admin/Reports';
import Finance from '../components/admin/Finance';
import StaffPortal from '../components/StaffPortal';
import StaffLoginPage from './StaffLoginPage';
import AdminLoginPage from './AdminLoginPage';

import AuditLogViewer from '../components/staff/AuditLogViewer';
import OrganizationManagement from '../components/admin/OrganizationManagement';
import PlanManagement from '../components/admin/PlanManagement';
import SubscriptionManagement from '../components/admin/SubscriptionManagement';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';

const AdminPage = () => {
    const { currentUser, logout, venues, activeVenueId, setActiveVenueId } = useData();
    const { language, toggleLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    if (!currentUser) {
        return <AdminLoginPage />;
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
        ...(currentUser.role === 'sysadmin' ? [
            { id: 'organizations', label: 'Organizations', icon: '🏛️' },
            { id: 'plans', label: 'Plans', icon: '📑' }
        ] : []),
        { id: 'venues', label: currentUser.role === 'sysadmin' ? 'Venues & Rooms' : 'Branches & Rooms', icon: '🏢' },
        ...(currentUser.role === 'manager' ? [{ id: 'subscription', label: 'Subscription', icon: '💎' }] : []),
        ...(currentUser.role !== 'sysadmin' ? [{ id: 'pos_view', label: 'Point of Sale', icon: '🖥️' }] : []),
        ...(currentUser.role === 'sysadmin' ? [{ id: 'users', label: 'Users', icon: '👥' }] : []),
        { id: 'staffs', label: 'Staffs', icon: '👥' },
        { id: 'audit', label: 'Audit Logs', icon: '📋' },
        { id: 'reports', label: 'Reports', icon: '📈' },
        { id: 'finance', label: 'Finance', icon: '💰' },
        { id: 'settings', label: 'Settings', icon: '⚙️' }
    ];



    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-[#121212] color-white relative">
            {/* Mobile Header */}
            <header className="lg:hidden flex justify-between items-center bg-[#1a1a24] p-4 border-b border-white/5 sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 bg-transparent border-none text-white cursor-pointer"
                    >
                        <i className="pi pi-bars text-xl"></i>
                    </button>
                    <div className="flex items-baseline">
                        <span className="text-xl font-black tracking-tighter text-[#eb79b2]">UB</span>
                        <span className="text-xl font-black tracking-tighter ml-1">KARAOKE</span>
                    </div>
                </div>
                <Button
                    label={language.toUpperCase()}
                    onClick={toggleLanguage}
                    className="h-9 px-4 text-xs font-black rounded-full p-button-outlined p-button-sm border-[#b000ff] text-[#eb79b2]"
                />
            </header>

            {/* Sidebar / Drawer */}
            <aside className={`
                fixed inset-0 z-[60] lg:relative lg:z-auto
                w-72 lg:w-64 bg-[#1a1a24] p-5 flex flex-col border-r border-white/5
                transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Mobile Sidebar Close Button */}
                <div className="lg:hidden flex justify-end mb-4">
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 -mr-2 bg-transparent border-none text-gray-500 cursor-pointer"
                    >
                        <i className="pi pi-times text-xl"></i>
                    </button>
                </div>

                <div className="hidden lg:flex justify-between items-center mb-8">
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-baseline">
                            <span className="text-2xl font-black tracking-tighter text-[#eb79b2] drop-shadow-[0_0_8px_rgba(175,175,175,0.3)]">UB</span>
                            <span className="text-2xl font-black tracking-tighter ml-1 logo-text-animated">KARAOKE</span>
                        </div>
                        <div className="w-2 h-2 rounded-full logo-dot-animated"></div>
                    </div>
                    <Button
                        label={language.toUpperCase()}
                        onClick={toggleLanguage}
                        className="h-8 px-3 text-[10px] font-black rounded-full p-button-outlined p-button-sm border-[#b000ff] text-[#eb79b2] hover:bg-[#b000ff]/10 transition-all"
                    />
                </div>

                <nav className="flex-1 overflow-y-auto">
                    <ul className="list-none p-0 m-0">
                        {navItems.map(item => (
                            <li key={item.id} className="mb-2">
                                <button
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-4 lg:py-3 rounded-xl border-none cursor-pointer flex items-center gap-4 text-base lg:text-sm transition-all shadow-sm ${activeTab === item.id
                                        ? 'bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold shadow-[0_0_20px_rgba(176,0,255,0.3)]'
                                        : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-[#b000ff]'
                                        }`}
                                >
                                    <span className="text-2xl lg:text-lg flex items-center justify-center min-w-[32px]">{item.icon}</span>
                                    <span className="font-bold tracking-tight">{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="border-t border-white/5 pt-6 mt-4">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center font-black text-white shadow-lg shadow-[#b000ff]/20">
                            {currentUser.name?.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="m-0 text-[10px] text-gray-500 uppercase tracking-widest font-black leading-none mb-1.5">{currentUser.role}</p>
                            <p className="m-0 text-sm font-bold text-white truncate">{currentUser.name}</p>
                        </div>
                    </div>
                    <Button
                        label="End Session"
                        icon="pi pi-power-off"
                        onClick={() => {
                            const redirectPath = logout();
                            navigate(redirectPath);
                        }}
                        className="w-full h-11 p-button-outlined p-button-danger border-[#ff3d32]/30 text-[#ff3d32] hover:bg-[#ff3d32]/10 transition-all font-bold text-xs uppercase tracking-widest rounded-xl mb-4 flex items-center justify-center gap-2"
                    />
                    <a href="/" className="block text-center text-gray-500 no-underline text-[10px] hover:text-[#b000ff] transition-colors">PUBLIC SITE</a>
                </div>
            </aside>

            {/* Sidebar Backdrop (Mobile only) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto pb-24 lg:pb-8">
                {/* Header Filter Bar - visible for core management tabs */}
                {['pos_view', 'venues'].includes(activeTab) && (
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
                {activeTab === 'plans' && <PlanManagement />}
                {activeTab === 'subscription' && <SubscriptionManagement />}
                {activeTab === 'venues' && <VenueManagement />}
                {activeTab === 'pos_view' && <StaffPortal />}
                {activeTab === 'users' && (currentUser.role === 'sysadmin' || currentUser.role === 'admin') && <UserManagement />}
                {activeTab === 'staffs' && <StaffManagement />}
                {activeTab === 'audit' && <AuditLogViewer />}
                {activeTab === 'reports' && <Reports />}
                {activeTab === 'finance' && <Finance />}
                {activeTab === 'settings' && <SystemSettings />}
            </main>

            {/* Bottom Navigation (Mobile Only) */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a24]/90 backdrop-blur-xl border-t border-white/5 px-2 py-3 flex justify-around items-center z-50">
                {[
                    { id: 'dashboard', label: 'Dash', icon: '📊' },
                    { id: 'venues', label: 'Venues', icon: '🏢' },
                    { id: 'staffs', label: 'Staff', icon: '👥' },
                    { id: 'settings', label: 'Settings', icon: '⚙️' }
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer transition-all ${activeTab === item.id ? 'text-[#eb79b2]' : 'text-gray-500'
                            }`}
                    >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
                        {activeTab === item.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#eb79b2] mt-0.5"></div>
                        )}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default AdminPage;
