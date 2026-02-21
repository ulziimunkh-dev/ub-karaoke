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

    return (
        <div className="space-y-6 lg:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 lg:gap-0">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white m-0">{t('organizationOverview')}</h2>
                    <p className="text-gray-400 mt-1 lg:mt-2 text-sm lg:text-base">{t('aggregatedStats')} <span className="text-[#eb79b2] font-semibold">{orgName}</span></p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-left sm:text-right">
                        <p className="text-[10px] lg:text-xs text-gray-500 uppercase tracking-widest font-bold">{t('liveStatus')}</p>
                        <p className="text-xs lg:text-sm text-white">{new Date().toLocaleTimeString()}</p>
                    </div>
                    <Button
                        icon="pi pi-refresh"
                        outlined
                        onClick={() => refreshData?.()}
                        className="h-10 w-10"
                        tooltip="Refresh"
                        tooltipOptions={{ position: 'bottom' }}
                    />
                </div>
            </div>

            {/* Organization Info Card */}
            {organization && (
                <div className="bg-gradient-to-r from-[#1a1a24] to-[#1a1a24]/80 p-6 rounded-3xl border border-[#b000ff]/20 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#b000ff]/5 rounded-full blur-[80px] -mr-16 -mt-16"></div>
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center font-black text-white text-xl shadow-lg shadow-[#b000ff]/20 shrink-0">
                            {orgName.charAt(0)}
                        </div>
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{t('organizationName')}</p>
                                <p className="text-white font-bold text-sm">{orgName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{t('orgCode')}</p>
                                <p className="text-[#eb79b2] font-mono font-bold text-sm tracking-wider">{organization.code || '—'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{t('status')}</p>
                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${organization.isActive !== false
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${organization.isActive !== false ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                    {organization.isActive !== false ? t('active') : t('inactive')}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{t('plan')}</p>
                                <p className="text-white font-bold text-sm">{organization.plan?.name || '—'}</p>
                            </div>
                        </div>
                        {currentUser.role === 'manager' && (
                            <Button
                                icon="pi pi-cog"
                                className="p-button-text p-button-rounded text-gray-400 hover:text-[#eb79b2] shrink-0"
                                tooltip={t('editOrgSettings')}
                                tooltipOptions={{ position: 'left' }}
                                onClick={() => setShowOrgSettings(true)}
                            />
                        )}
                    </div>
                    {/* Extra org details row */}
                    {(organization.phone || organization.email || organization.address) && (
                        <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-white/5 relative z-10">
                            {organization.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <i className="pi pi-phone text-[#eb79b2] text-xs"></i>
                                    <a href={`tel:${organization.phone}`} className="text-gray-300 no-underline hover:text-[#eb79b2] transition-colors">{organization.phone}</a>
                                </div>
                            )}
                            {organization.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <i className="pi pi-envelope text-[#eb79b2] text-xs"></i>
                                    <a href={`mailto:${organization.email}`} className="text-gray-300 no-underline hover:text-[#eb79b2] transition-colors">{organization.email}</a>
                                </div>
                            )}
                            {organization.address && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <i className="pi pi-map-marker text-[#eb79b2] text-xs"></i>
                                    <span className="text-gray-300">{organization.address}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group cursor-pointer"
                    onClick={() => onNavigate?.('bookings')}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#b000ff]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#b000ff]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{t('totalBookings')}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{filteredBookings.length}</span>
                        {pendingBookings > 0 && <span className="text-xs text-yellow-500 font-bold">{pendingBookings} {t('awaitingApproval')}</span>}
                    </div>
                </div>

                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group cursor-pointer"
                    onClick={() => onNavigate?.('finance')}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#4CAF50]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#4CAF50]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{t('branchRevenue')}</p>
                    <p className="text-3xl font-black text-[#4CAF50]">{totalRevenue.toLocaleString()}₮</p>
                </div>

                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group cursor-pointer"
                    onClick={() => onNavigate?.('venues')}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#2196F3]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#2196F3]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{t('activeBranches')}</p>
                    <p className="text-3xl font-black text-white">{filteredVenues.length}</p>
                </div>

                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group cursor-pointer"
                    onClick={() => onNavigate?.('subscription')}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#eb79b2]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#eb79b2]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{t('subscription')}</p>
                    <p className="text-xl font-black text-[#eb79b2] uppercase">{organization?.plan?.name || '—'}</p>
                </div>
            </div>

            <div className="bg-[#1a1a24] p-8 rounded-3xl border border-white/5 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <i className="pi pi-bolt text-[#eb79b2]"></i> {t('quickActions')}
                </h3>
                <div className="flex flex-wrap gap-4">
                    <Button
                        label={t('manualReservation')}
                        icon="pi pi-plus-circle"
                        className="p-button-outlined p-button-info px-6 h-12 font-bold !bg-white/5 border-white/10 hover:!bg-white/10 transition-all rounded-xl"
                        onClick={() => onNavigate?.('pos_view')}
                    />
                    <Button
                        label={t('performanceReport')}
                        icon="pi pi-chart-line"
                        className="p-button-outlined px-6 h-12 font-bold !bg-white/5 border-white/10 hover:!bg-white/10 transition-all rounded-xl"
                        onClick={() => onNavigate?.('reports')}
                    />
                    <Button
                        label={t('viewBranchStaff')}
                        icon="pi pi-users"
                        className="p-button-outlined px-6 h-12 font-bold !bg-white/5 border-white/10 hover:!bg-white/10 transition-all rounded-xl"
                        onClick={() => onNavigate?.('staffs')}
                    />
                    <Button
                        label={t('manageBookings')}
                        icon="pi pi-calendar"
                        className="p-button-outlined px-6 h-12 font-bold !bg-white/5 border-white/10 hover:!bg-white/10 transition-all rounded-xl"
                        onClick={() => onNavigate?.('bookings')}
                    />
                </div>
            </div>

            {/* Organization Settings Dialog */}
            <Dialog
                header={
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center">
                            <i className="pi pi-building text-white text-sm"></i>
                        </div>
                        <span className="text-white font-bold">{t('editOrgSettings')}</span>
                    </div>
                }
                visible={showOrgSettings}
                onHide={() => setShowOrgSettings(false)}
                style={{ width: '550px' }}
                className="org-settings-dialog"
                contentClassName="bg-[#1a1a24] p-0"
                headerClassName="bg-[#1a1a24] border-b border-white/10"
                modal
                draggable={false}
            >
                <div className="p-6 space-y-5">
                    {/* Org Code — Read Only */}
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">{t('orgCode')}</label>
                        <div className="flex items-center gap-3">
                            <InputText
                                value={organization?.code || ''}
                                disabled
                                className="flex-1 h-11 bg-black/30 border-white/5 rounded-xl text-gray-500 font-mono tracking-wider opacity-70"
                            />
                            <span className="text-[10px] text-gray-600 italic whitespace-nowrap">
                                <i className="pi pi-lock text-[10px] mr-1"></i>
                                {t('assignedBySysadmin')}
                            </span>
                        </div>
                    </div>

                    {/* Org Name */}
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">{t('organizationName')}</label>
                        <InputText
                            value={orgForm.name}
                            onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                            className="w-full h-11 bg-black/20 border-white/10 rounded-xl text-white"
                            placeholder={t('organizationName')}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">{t('description')}</label>
                        <InputTextarea
                            value={orgForm.description}
                            onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
                            className="w-full bg-black/20 border-white/10 rounded-xl text-white"
                            rows={3}
                            placeholder={t('orgDescPlaceholder')}
                            autoResize
                        />
                    </div>

                    {/* Phone & Email row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">{t('phone')}</label>
                            <InputText
                                value={orgForm.phone}
                                onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                                className="w-full h-11 bg-black/20 border-white/10 rounded-xl text-white"
                                placeholder="+976 ..."
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">{t('email')}</label>
                            <InputText
                                value={orgForm.email}
                                onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                                className="w-full h-11 bg-black/20 border-white/10 rounded-xl text-white"
                                placeholder="org@example.com"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">{t('address')}</label>
                        <InputText
                            value={orgForm.address}
                            onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                            className="w-full h-11 bg-black/20 border-white/10 rounded-xl text-white"
                            placeholder={t('addressPlaceholder')}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                        <Button
                            label={t('cancel')}
                            className="p-button-text text-gray-400 hover:text-white font-bold"
                            onClick={() => setShowOrgSettings(false)}
                        />
                        <Button
                            label={saving ? t('saving') : t('saveChanges')}
                            icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                            className="px-6 h-11 font-bold rounded-xl bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white shadow-lg shadow-[#b000ff]/20"
                            onClick={handleSaveOrg}
                            disabled={saving || !orgForm.name?.trim()}
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default ManagerDashboard;
