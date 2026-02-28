import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';

const ManagerDashboard = ({ onNavigate }) => {
    const { bookings, venues, currentUser, organizations, updateOrganization, refreshData } = useData();
    const { t } = useLanguage();
    const [showOrgSettings, setShowOrgSettings] = useState(false);
    const [orgForm, setOrgForm] = useState({});
    const [saving, setSaving] = useState(false);

    // Find organization for this manager
    const organization = organizations.find(o => o.id === currentUser.organizationId);

    // Filter data to this organization
    const filteredBookings = bookings.filter(b => b.organizationId === currentUser.organizationId);
    const filteredVenues = venues.filter(v => v.organizationId === currentUser.organizationId);

    // Dashboard Stats
    const totalRevenue = filteredBookings.reduce((sum, b) => b.status === 'Confirmed' || b.status === 'Paid' ? sum + b.total : sum, 0);
    const pendingBookings = filteredBookings.filter(b => b.status === 'Pending').length;
    const orgName = organization?.name || currentUser.organizationName || 'My Organization';

    // Auto-refresh dashboard data every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refreshData?.();
        }, 30000);
        return () => clearInterval(interval);
    }, [refreshData]);

    useEffect(() => {
        if (organization) {
            setOrgForm({
                name: organization.name || '',
                description: organization.description || '',
                phone: organization.phone || '',
                email: organization.email || '',
                address: organization.address || ''
            });
        }
    }, [organization]);

    const handleSaveOrg = async () => {
        if (!organization) return;
        setSaving(true);
        try {
            await updateOrganization(organization.id, orgForm);
            setShowOrgSettings(false);
            // Refresh all dashboard data after updating
            refreshData?.();
        } catch (err) {
            console.error('Failed to update organization:', err);
        } finally {
            setSaving(false);
        }
    };

    // Placeholder for orgInfo and metrics, as they are used in the provided snippet but not defined in the original context
    // Assuming orgInfo is similar to 'organization' and metrics is a derived array for the new layout
    const orgInfo = organization; // Using existing 'organization' for 'orgInfo'
    const metrics = [
        { label: t('totalBookings'), value: filteredBookings.length, icon: 'pi-calendar', color: 'from-[#b000ff] to-[#eb79b2]' },
        { label: t('branchRevenue'), value: totalRevenue.toLocaleString() + '₮', icon: 'pi-wallet', color: 'from-green-500 to-green-400' },
        { label: t('activeBranches'), value: filteredVenues.length, icon: 'pi-map-marker', color: 'from-blue-500 to-blue-400' },
        { label: t('subscription'), value: organization?.plan?.name || '—', icon: 'pi-verified', color: 'from-[#eb79b2] to-[#b000ff]' }
    ];

    return (
        <div className="manager-dashboard max-w-7xl mx-auto w-full px-4 sm:px-0">
            {/* ── Dashboard Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-[0_10px_25px_rgba(176,0,255,0.4)]">
                        <i className="pi pi-briefcase text-white text-2xl"></i>
                    </div>
                    <div>
                        <h2 className="m-0 text-3xl font-black text-white tracking-tight leading-none uppercase">{t('managerPortal') || 'BRANCH OVERVIEW'}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <i className="pi pi-building text-[#eb79b2] text-xs"></i>
                            <p className="m-0 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                                {orgInfo?.name || t('loading')} <span className="text-white/20 mx-2">|</span> {t('activeOperations') || 'ACTIVE OPERATIONS'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                    <Button icon="pi pi-refresh" outlined onClick={refreshData} className="h-10 w-10 border-white/10 text-white/50 hover:text-white" />
                    <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
                    <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/5">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none mb-1">Status</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                            <span className="text-xs font-bold text-white uppercase tracking-tighter">Operational</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Metric Highlights ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                {metrics.map((metric, idx) => (
                    <div key={idx} className="group relative bg-[#1a1a24] p-6 rounded-3xl border border-white/5 overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] cursor-pointer">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${metric.color} opacity-[0.03] group-hover:opacity-[0.1] transition-opacity blur-3xl rounded-full -mr-10 -mt-10`}></div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${metric.color} flex items-center justify-center text-white text-xl shadow-lg ring-4 ring-white/5`}>
                                <i className={`pi ${metric.icon}`}></i>
                            </div>
                            {idx === 0 && pendingBookings > 0 && (
                                <span className="bg-yellow-500 text-black text-[8px] font-black px-2 py-1 rounded-lg uppercase animate-pulse">
                                    {pendingBookings} New
                                </span>
                            )}
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
                {/* ── Organization Info Card ── */}
                <div className="lg:col-span-8 bg-white/5 rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#b000ff] opacity-5 blur-[100px] rounded-full group-hover:opacity-10 transition-opacity"></div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden ring-4 ring-[#b000ff]/10">
                                {organization?.logo ? (
                                    <img src={api.getFileUrl(organization.logo)} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <i className="pi pi-building text-[#b000ff] text-2xl"></i>
                                )}
                            </div>
                            <div>
                                <h3 className="m-0 text-2xl font-black text-white tracking-tight">{orgName}</h3>
                                <p className="m-0 text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{organization?.type || 'Standard'} {t('organization')}</p>
                            </div>
                        </div>
                        {currentUser.role === 'manager' && (
                            <Button
                                icon="pi pi-cog"
                                className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                                onClick={() => setShowOrgSettings(true)}
                                tooltip={t('editOrgSettings')}
                            />
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: t('subscriptionStatus'), value: t('active'), color: 'text-green-400', bg: 'bg-green-400' },
                            { label: t('registeredVenues'), value: filteredVenues.length, color: 'text-[#b000ff]', bg: 'bg-[#b000ff]' },
                            { label: t('totalStaff'), value: 0, color: 'text-[#2196F3]', bg: 'bg-[#2196F3]' } // Stafford count not directly available here, using 0 as placeholder or fetch later
                        ].map((info, idx) => (
                            <div key={idx} className="bg-black/40 p-5 rounded-2xl border border-white/5 transition-colors hover:border-white/20">
                                <p className="m-0 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{info.label}</p>
                                <p className={`m-0 text-xl font-black ${info.color} uppercase tracking-tight`}>{info.value}</p>
                                <div className={`h-1 w-12 ${info.bg} rounded-full mt-4 opacity-50`}></div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap gap-4">
                        {organization?.phone && (
                            <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/5">
                                <i className="pi pi-phone text-[#eb79b2] text-xs"></i>
                                <span className="text-xs font-bold text-gray-300">{organization.phone}</span>
                            </div>
                        )}
                        {organization?.email && (
                            <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/5">
                                <i className="pi pi-envelope text-[#eb79b2] text-xs"></i>
                                <span className="text-xs font-bold text-gray-300">{organization.email}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Quick Actions ── */}
                <div className="lg:col-span-4 bg-[#1a1a24] rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                            <i className="pi pi-bolt text-[#ff9800]"></i>
                        </div>
                        <h3 className="m-0 text-xl font-black text-white tracking-tight uppercase">{t('quickActions')}</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { id: 'pos_view', label: t('manualReservation'), icon: 'pi-desktop', color: 'bg-[#b000ff]', desc: 'Point of Sale' },
                            { id: 'staffs', label: t('manageStaff'), icon: 'pi-users', color: 'bg-blue-500', desc: 'Team management' },
                            { id: 'bookings', label: t('manageBookings'), icon: 'pi-calendar', color: 'bg-[#eb79b2]', desc: 'Customer reservations' },
                            { id: 'reports', label: t('performanceReport'), icon: 'pi-chart-line', color: 'bg-green-500', desc: 'Branch analytics' }
                        ].map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => onNavigate?.(action.id)}
                                className="w-full flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all hover:bg-black/60 group text-left cursor-pointer"
                            >
                                <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center text-white text-xl shadow-lg ring-4 ring-white/5 group-hover:scale-110 transition-transform`}>
                                    <i className={`pi ${action.icon}`}></i>
                                </div>
                                <div className="overflow-hidden">
                                    <p className="m-0 text-sm font-black text-white uppercase tracking-tight truncate">{action.label}</p>
                                    <p className="m-0 text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider truncate">{action.desc}</p>
                                </div>
                                <i className="pi pi-chevron-right ml-auto text-gray-700 group-hover:translate-x-1 transition-transform"></i>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Organization Settings Dialog ── */}
            <Dialog
                header={
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-lg">
                            <i className="pi pi-building text-white text-lg"></i>
                        </div>
                        <div>
                            <h3 className="m-0 text-xl font-bold text-white tracking-tight">{t('editOrgSettings')}</h3>
                            <p className="m-0 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">IDENTITY & BRANDING</p>
                        </div>
                    </div>
                }
                visible={showOrgSettings}
                onHide={() => setShowOrgSettings(false)}
                className="w-full max-w-[95vw] md:max-w-[600px] premium-dialog"
                contentClassName="bg-[#0f0f15] p-0"
                modal
                draggable={false}
            >
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto text-left">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-xl">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 mb-2">{t('organizationName')}</label>
                                <InputText
                                    value={orgForm.name}
                                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                                    className="w-full h-12 bg-black/20 border-white/10 rounded-xl text-white font-bold px-4"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 mb-2">{t('phone')}</label>
                                <InputText
                                    value={orgForm.phone}
                                    onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                                    className="w-full h-12 bg-black/20 border-white/10 rounded-xl text-white font-bold px-4"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 mb-2">{t('email')}</label>
                                <InputText
                                    value={orgForm.email}
                                    onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                                    className="w-full h-12 bg-black/20 border-white/10 rounded-xl text-white font-bold px-4"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 mb-2">{t('address')}</label>
                                <InputText
                                    value={orgForm.address}
                                    onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                                    className="w-full h-12 bg-black/20 border-white/10 rounded-xl text-white font-bold px-4"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-8 border-t border-white/5 flex gap-4 bg-[#0f0f15]">
                    <Button
                        label={t('cancel')}
                        className="flex-1 h-14 text-white font-black uppercase tracking-widest hover:bg-white/5 rounded-2xl transition-all"
                        onClick={() => setShowOrgSettings(false)}
                    />
                    <Button
                        label={saving ? t('saving') : t('saveChanges')}
                        loading={saving}
                        className="flex-1 h-14 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_rgba(176,0,255,0.4)]"
                        onClick={handleSaveOrg}
                    />
                </div>
            </Dialog>

            <style>{`
                .manager-dashboard {
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

export default ManagerDashboard;
