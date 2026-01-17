import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Button } from 'primereact/button';

const AdminDashboard = () => {
    const { bookings, venues, organizations, users } = useData();

    // Global Stats for Sysadmin
    const globalRevenue = bookings.reduce((sum, b) => b.status === 'Confirmed' || b.status === 'Paid' ? sum + b.total : sum, 0);
    const totalRequests = bookings.filter(b => b.status === 'Pending').length;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white m-0">Global Overview</h2>
                    <p className="text-gray-400 mt-2">Aggregated diagnostics for across <span className="text-[#b000ff] font-semibold">{organizations.length}</span> organizations</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Network Status</p>
                    <p className="text-sm text-white flex items-center gap-2 justify-end">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Healthy & Operational
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#b000ff]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#b000ff]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Global Organizations</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{organizations.length}</span>
                        <span className="text-xs text-blue-400 font-bold">Active Entities</span>
                    </div>
                </div>

                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#4CAF50]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#4CAF50]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Platform Revenue</p>
                    <p className="text-3xl font-black text-[#4CAF50]">{globalRevenue.toLocaleString()}₮</p>
                </div>

                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#2196F3]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#2196F3]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Registered Users</p>
                    <p className="text-3xl font-black text-white">{users.length}</p>
                </div>

                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#eb79b2]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#eb79b2]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Pending Inquiries</p>
                    <p className="text-3xl font-black text-white">{totalRequests}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#1a1a24] p-8 rounded-3xl border border-white/5 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6">System Administration</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            label="Audit Logs"
                            icon="pi pi-history"
                            className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 text-left flex flex-col items-start gap-1"
                        />
                        <Button
                            label="Financial CSV"
                            icon="pi pi-file-excel"
                            className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 text-left flex flex-col items-start gap-1"
                        />
                    </div>
                </div>

                <div className="bg-[#1a1a24] p-8 rounded-3xl border border-white/5 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6">Platform Settings</h3>
                    <div className="flex gap-4">
                        <div className="flex-1 p-4 bg-white/5 border border-white/10 rounded-xl">
                            <p className="text-xs text-gray-500 font-bold mb-1 uppercase">Global Commission</p>
                            <p className="text-xl font-black text-[#b000ff]">15%</p>
                        </div>
                        <div className="flex-1 p-4 bg-white/5 border border-white/10 rounded-xl">
                            <p className="text-xs text-gray-500 font-bold mb-1 uppercase">Tax Compliance</p>
                            <p className="text-xl font-black text-[#4CAF50]">Active</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
