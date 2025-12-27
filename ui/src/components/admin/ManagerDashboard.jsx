import React from 'react';
import { useData } from '../../contexts/DataContext';

const ManagerDashboard = () => {
    const { bookings, venues, currentUser, activeVenueId } = useData();

    // Filter data to this organization (All branches combined)
    const filteredBookings = bookings.filter(b => b.organizationId === currentUser.organizationId);
    const filteredVenues = venues.filter(v => v.organizationId === currentUser.organizationId);

    // Dashboard Stats
    const totalRevenue = filteredBookings.reduce((sum, b) => b.status === 'Confirmed' || b.status === 'Paid' ? sum + b.total : sum, 0);
    const pendingBookings = filteredBookings.filter(b => b.status === 'Pending').length;
    const orgName = currentUser.organizationName || 'My Organization';

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white m-0">Organization Overview</h2>
                    <p className="text-gray-400 mt-2">Aggregated statistics for: <span className="text-[#eb79b2] font-semibold">{orgName}</span></p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Live Status</p>
                    <p className="text-sm text-white">{new Date().toLocaleTimeString()}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#b000ff]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#b000ff]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Bookings Today</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{filteredBookings.length}</span>
                        {pendingBookings > 0 && <span className="text-xs text-yellow-500 font-bold">{pendingBookings} awaiting approval</span>}
                    </div>
                </div>

                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#4CAF50]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#4CAF50]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Branch Revenue</p>
                    <p className="text-3xl font-black text-[#4CAF50]">{totalRevenue.toLocaleString()}₮</p>
                </div>

                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#2196F3]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#2196F3]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Active Branches</p>
                    <p className="text-3xl font-black text-white">{filteredVenues.length}</p>
                </div>

                <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#eb79b2]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#eb79b2]/10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Manager Access</p>
                    <p className="text-xl font-black text-[#eb79b2] uppercase">Authorized</p>
                </div>
            </div>

            <div className="bg-[#1a1a24] p-8 rounded-3xl border border-white/5 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-6">Manager Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                    <button className="px-6 h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10 flex items-center gap-2">
                        <span>➕</span> Manual Reservation
                    </button>
                    <button className="px-6 h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10 flex items-center gap-2">
                        <span>📊</span> Branch Performance Report
                    </button>
                    <button className="px-6 h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10 flex items-center gap-2">
                        <span>👥</span> View Branch Staff
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
