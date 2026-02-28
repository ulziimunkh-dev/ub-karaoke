import React from 'react';
import { Button } from 'primereact/button';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';

const AdminDashboard = ({ onNavigate }) => {
    const { users, organizations, bookings, payouts, refreshData } = useData();
    const { t } = useLanguage();

    const globalRevenue = bookings.reduce((sum, b) => b.status === 'Confirmed' || b.status === 'Paid' ? sum + b.total : sum, 0);
    const totalRequests = bookings.filter(b => b.status === 'Pending').length;
    const pendingPayoutsCount = payouts.filter(p => p.status === 'PENDING').length;

    const metrics = [
        { label: t('globalOrganizations'), value: organizations.length, icon: 'pi-building', color: 'from-[#2196F3] to-[#00BCD4]' },
        { label: t('platformRevenue'), value: `${globalRevenue.toLocaleString()}₮`, icon: 'pi-wallet', color: 'from-[#4CAF50] to-[#8BC34A]' },
        { label: t('pendingPayouts'), value: pendingPayoutsCount, icon: 'pi-money-bill', color: 'from-[#FF9800] to-[#FF5722]' },
        { label: t('totalRegisteredUsers'), value: users.length, icon: 'pi-users', color: 'from-[#b000ff] to-[#eb79b2]' },
    ];

    return (
        <div className="admin-dashboard max-w-7xl mx-auto w-full px-4 sm:px-0">
            {/* ── Dashboard Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-[0_10px_25px_rgba(176,0,255,0.4)]">
                        <i className="pi pi-th-large text-white text-2xl"></i>
                    </div>
                    <div>
                        <h2 className="m-0 text-3xl font-black text-white tracking-tight leading-none uppercase">{t('adminDashboardTitle') || 'SYSTEM OVERVIEW'}</h2>
                        <p className="m-0 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-60">
                            <span className="text-[#eb79b2]">Live</span> {t('systemHealthPerformance') || 'SYSTEM HEALTH & PERFORMANCE'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                    <Button
                        icon="pi pi-refresh"
                        outlined
                        onClick={() => refreshData?.()}
                        className="h-10 w-10 border-white/10 text-white/50 hover:text-white"
                        tooltip={t('refresh')}
                    />
                    <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
                    <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/5">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none mb-1"></span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                            <span className="text-xs font-bold text-white uppercase tracking-tighter">Live</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Key Metrics Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                {metrics.map((metric, idx) => (
                    <div key={idx} className="group relative bg-[#1a1a24] p-6 rounded-3xl border border-white/5 overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] cursor-pointer">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${metric.color} opacity-[0.03] group-hover:opacity-[0.1] transition-opacity blur-3xl rounded-full -mr-10 -mt-10`}></div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${metric.color} flex items-center justify-center text-white text-xl shadow-lg ring-4 ring-white/5`}>
                                <i className={`pi ${metric.icon}`}></i>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{t('trend') || 'TREND'}</span>
                                <span className="text-xs font-black text-green-400 flex items-center gap-1">
                                    <i className="pi pi-arrow-up text-[8px]"></i>
                                    {Math.floor(Math.random() * 10) + 2}%
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="m-0 text-sm font-black text-gray-500 uppercase tracking-widest">{metric.label}</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                                <p className="m-0 text-3xl font-black text-white tracking-tighter tabular-nums">{metric.value}</p>
                            </div>
                        </div>

                        <div className="mt-4 h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative z-10">
                            <div className={`h-full bg-gradient-to-r ${metric.color} rounded-full`} style={{ width: '70%', boxShadow: '0 0 10px rgba(176, 0, 255, 0.3)' }}></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── System Actions ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Shortcuts */}
                <div className="lg:col-span-2 bg-white/5 rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#b000ff] opacity-5 blur-[100px] rounded-full group-hover:opacity-10 transition-opacity"></div>

                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                            <i className="pi pi-bolt text-[#eb79b2]"></i>
                        </div>
                        <h3 className="m-0 text-xl font-black text-white tracking-tight uppercase">{t('systemShortcuts') || 'SYSTEM SHORTCUTS'}</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { id: 'users', label: t('manageUsers'), icon: 'pi-users', color: 'from-[#b000ff] to-[#eb79b2]', desc: 'Manage system users & access' },
                            { id: 'venues', label: t('venueConfig'), icon: 'pi-building', color: 'from-[#2196F3] to-[#00BCD4]', desc: 'Configure branches & rooms' },
                            { id: 'finance', label: t('managePayouts'), icon: 'pi-money-bill', color: 'from-[#FF9800] to-[#FF5722]', desc: t('payoutManagement') },
                            { id: 'audit', label: t('auditTrail'), icon: 'pi-eye', color: 'from-[#4CAF50] to-[#8BC34A]', desc: 'Review security & audit logs' }
                        ].map((btn, idx) => (
                            <button key={idx} onClick={() => onNavigate?.(btn.id)} className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all hover:bg-black/60 group/btn text-left cursor-pointer">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${btn.color} flex items-center justify-center text-white text-xl shadow-lg ring-4 ring-white/5 group-hover/btn:scale-110 transition-transform`}>
                                    <i className={`pi ${btn.icon}`}></i>
                                </div>
                                <div className="overflow-hidden">
                                    <p className="m-0 text-sm font-black text-white uppercase tracking-tight truncate">{btn.label}</p>
                                    <p className="m-0 text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider truncate">{btn.desc}</p>
                                </div>
                                <i className="pi pi-chevron-right ml-auto text-gray-700 group-hover/btn:translate-x-1 transition-transform"></i>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Resource Summary */}
                <div className="bg-[#1a1a24] rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                <i className="pi pi-database text-[#b000ff]"></i>
                            </div>
                            <h3 className="m-0 text-xl font-black text-white tracking-tight uppercase">{t('resources') || 'RESOURCES'}</h3>
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: 'Active Sessions', val: '124', percent: 65, color: 'bg-[#b000ff]' },
                                { label: 'API Usage', val: '8.2k/hr', percent: 42, color: 'bg-[#2196F3]' },
                                { label: 'Storage', val: '4.8 GB', percent: 85, color: 'bg-[#FF9800]' }
                            ].map((res, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.15em]">{res.label}</span>
                                        <span className="text-xs font-black text-white">{res.val}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-black/40 rounded-full border border-white/5 overflow-hidden">
                                        <div className={`h-full ${res.color} rounded-full`} style={{ width: `${res.percent}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-white/5">
                        <div className="bg-black/40 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                <span className="text-xs font-black text-white uppercase tracking-wider">Cloud Engine</span>
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase">99.9% Uptime</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .admin-dashboard {
                    animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
