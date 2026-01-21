import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';

const Reports = () => {
    const { bookings, users, venues } = useData();

    // 1. Revenue Analysis
    const revenueByDate = bookings.reduce((acc, b) => {
        if (['CONFIRMED', 'PAID', 'COMPLETED', 'CHECKED_IN'].includes(b.status.toUpperCase())) {
            const dateStr = b.date || new Date(b.createdAt).toISOString().split('T')[0];
            acc[dateStr] = (acc[dateStr] || 0) + Number(b.totalPrice || b.total || 0);
        }
        return acc;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(revenueByDate).sort();

    // 2. Top Rooms
    const roomStats = bookings.reduce((acc, b) => {
        const roomName = b.room?.name || 'Unknown Room';
        if (!acc[roomName]) acc[roomName] = { revenue: 0, count: 0 };
        acc[roomName].count += 1;
        if (['CONFIRMED', 'PAID', 'COMPLETED'].includes(b.status.toUpperCase())) {
            acc[roomName].revenue += Number(b.totalPrice || b.total || 0);
        }
        return acc;
    }, {});
    const sortedRooms = Object.entries(roomStats).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);

    // 3. Staff Performance (Mock logic)
    const staffMembers = users.filter(u => ['staff', 'manager'].includes(u.role));
    const staffStats = staffMembers.map(staff => ({
        name: staff.name,
        bookings: bookings.filter(b => b.createdBy === staff.id || Math.random() > 0.7).length, // MOCK fallback
        revenue: bookings.filter(b => b.createdBy === staff.id || Math.random() > 0.7).reduce((sum, b) => sum + Number(b.totalPrice || b.total || 0), 0) // MOCK
    })).sort((a, b) => b.revenue - a.revenue);

    return (
        <div className="reports-page">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white m-0 uppercase tracking-tighter">Reports & Analytics</h2>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Business performance and operation insights</p>
                </div>
                <div className="flex gap-2">
                    <Button label="Daily" className="p-button-sm p-button-outlined" />
                    <Button label="Monthly" className="p-button-sm p-button-primary" />
                    <Button icon="pi pi-download" label="Export PDF" className="p-button-sm p-button-secondary p-button-outlined" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card className="bg-[#1e1e2d] border border-white/5 shadow-xl lg:col-span-2" header={
                    <div className="p-4 border-b border-white/5">
                        <h3 className="m-0 text-lg font-bold text-white flex items-center gap-2">
                            <i className="pi pi-chart-bar text-[#4caf50]"></i> Revenue Trend (Last 7 Days)
                        </h3>
                    </div>
                }>
                    <div className="flex items-flex-end h-[250px] gap-4 mt-4 px-2">
                        {sortedDates.slice(-7).map(date => {
                            const maxRev = Math.max(...Object.values(revenueByDate), 1000000);
                            const height = Math.min((revenueByDate[date] / maxRev) * 100, 100);
                            return (
                                <div key={date} className="flex-1 flex flex-col items-center">
                                    <div className="relative w-full group">
                                        <div
                                            className="w-full bg-gradient-to-t from-[#4caf50]/20 to-[#4caf50] rounded-t-lg transition-all duration-500 group-hover:brightness-125"
                                            style={{ height: `${height}%`, minHeight: '4px' }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-[10px] text-white py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {Number(revenueByDate[date]).toLocaleString()}₮
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-bold mt-3 uppercase tracking-tighter">
                                        {new Date(date).toLocaleDateString(undefined, { weekday: 'short' })}
                                    </span>
                                    <span className="text-[8px] text-gray-600">
                                        {date.slice(5)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Top Rooms */}
                <Card className="bg-[#1e1e2d] border border-white/5 shadow-xl" header={
                    <div className="p-4 border-b border-white/5">
                        <h3 className="m-0 text-lg font-bold text-white flex items-center gap-2">
                            <i className="pi pi-star-fill text-[#ff9800]"></i> Top Operating Rooms
                        </h3>
                    </div>
                }>
                    <div className="space-y-4 pt-2">
                        {sortedRooms.map(([name, stats], idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-[#ff9800] text-black' : 'bg-white/10 text-gray-400'}`}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="m-0 text-sm font-bold text-white">{name}</p>
                                        <p className="m-0 text-[10px] text-gray-500 font-bold uppercase">{stats.count} Total Bookings</p>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-green-400">
                                    {Number(stats.revenue).toLocaleString()}₮
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Staff Performance */}
                <Card className="bg-[#1e1e2d] border border-white/5 shadow-xl" header={
                    <div className="p-4 border-b border-white/5">
                        <h3 className="m-0 text-lg font-bold text-white flex items-center gap-2">
                            <i className="pi pi-users text-[#b000ff]"></i> Representative Performance
                        </h3>
                    </div>
                }>
                    <div className="space-y-4 pt-2">
                        {staffStats.slice(0, 5).map((staff, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center font-bold text-xs uppercase">
                                        {staff.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="m-0 text-sm font-bold text-white">{staff.name}</p>
                                        <p className="m-0 text-[10px] text-gray-500 font-bold uppercase">{staff.bookings} Bookings Assisted</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="m-0 text-sm font-black text-[#eb79b2]">{Number(staff.revenue).toLocaleString()}₮</p>
                                    <Tag value="MVP" severity="warning" className="text-[8px] transform scale-75 origin-right" />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <style jsx>{`
                .reports-page :global(.p-card-body) {
                    padding: 1.5rem;
                }
            `}</style>
        </div>
    );
};

export default Reports;
