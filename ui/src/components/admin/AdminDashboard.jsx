import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Button } from 'primereact/button';
import { useLanguage } from '../../contexts/LanguageContext';

const AdminDashboard = () => {
    const { bookings, venues, organizations, users } = useData();
    const { t } = useLanguage();

    // Global Stats for Sysadmin
    const globalRevenue = bookings.reduce((sum, b) => b.status === 'Confirmed' || b.status === 'Paid' ? sum + b.total : sum, 0);
    const totalRequests = bookings.filter(b => b.status === 'Pending').length;

    return (
        <div className="space-y-6 lg:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 lg:gap-0">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white m-0">{t('globalOverview')}</h2>
                    <p className="text-gray-400 mt-1 lg:mt-2 text-sm lg:text-base">{t('aggregatedDiagnostics')} <span className="text-[#b000ff] font-semibold">{organizations.length}</span> {t('organizationsLabel')}</p>
                </div>
                <div className="text-left sm:text-right">
                    <p className="text-[10px] lg:text-xs text-gray-500 uppercase tracking-widest font-bold">{t('networkStatus')}</p>
                    <p className="text-xs lg:text-sm text-white flex items-center gap-2 sm:justify-end">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {t('healthyOperational')}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#b000ff]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#b000ff]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{t('globalOrganizations')}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{organizations.length}</span>
                        <span className="text-xs text-blue-400 font-bold">{t('activeEntities')}</span>
                    </div>
                </div>

                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#4CAF50]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#4CAF50]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{t('platformRevenue')}</p>
                    <p className="text-3xl font-black text-[#4CAF50]">{globalRevenue.toLocaleString()}₮</p>
                </div>

                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#2196F3]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#2196F3]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{t('totalRegisteredUsers')}</p>
                    <p className="text-3xl font-black text-white">{users.length}</p>
                </div>

                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#eb79b2]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#eb79b2]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{t('pendingInquiries')}</p>
                    <p className="text-3xl font-black text-white">{totalRequests}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#1a1a24] p-8 rounded-3xl border border-white/5 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6">{t('systemAdministration')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            label={t('auditLogs')}
                            icon="pi pi-history"
                            className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 text-left flex flex-col items-start gap-1"
                        />
                        <Button
                            label={t('financialCSV')}
                            icon="pi pi-file-excel"
                            className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 text-left flex flex-col items-start gap-1"
                        />
                    </div>
                </div>

                <div className="bg-[#1a1a24] p-8 rounded-3xl border border-white/5 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6">{t('platformSettings')}</h3>
                    <div className="flex gap-4">
                        <div className="flex-1 p-4 bg-white/5 border border-white/10 rounded-xl">
                            <p className="text-xs text-gray-500 font-bold mb-1 uppercase">{t('globalCommission')}</p>
                            <p className="text-xl font-black text-[#b000ff]">15%</p>
                        </div>
                        <div className="flex-1 p-4 bg-white/5 border border-white/10 rounded-xl">
                            <p className="text-xs text-gray-500 font-bold mb-1 uppercase">{t('taxCompliance')}</p>
                            <p className="text-xl font-black text-[#4CAF50]">{t('active')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
