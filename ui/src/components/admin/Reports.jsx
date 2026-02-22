import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';

const Reports = () => {
    const { bookings, users, venues } = useData();
    const { t } = useLanguage();
    const [reportType, setReportType] = useState('daily'); // 'daily' or 'monthly'

    // 1. Data Aggregation based on reportType
    const aggregatedData = bookings.reduce((acc, b) => {
        const status = b.status?.toUpperCase();
        if (['CONFIRMED', 'PAID', 'COMPLETED', 'CHECKED_IN'].includes(status)) {
            let key;
            const date = b.date ? new Date(b.date) : (b.createdAt ? new Date(b.createdAt) : null);
            if (date) {
                if (reportType === 'daily') {
                    // YYYY-MM-DD
                    key = date.toISOString().split('T')[0];
                } else {
                    // YYYY-MM
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                }
                acc[key] = (acc[key] || 0) + Number(b.totalPrice || b.total || 0);
            }
        }
        return acc;
    }, {});

    const sortedKeys = Object.keys(aggregatedData).sort();
    const displayKeys = reportType === 'daily' ? sortedKeys.slice(-7) : sortedKeys.slice(-6);

    // 2. Top Rooms
    const roomStats = bookings.reduce((acc, b) => {
        const roomName = b.room?.name || t('unknownRoom');
        if (!acc[roomName]) acc[roomName] = { revenue: 0, count: 0 };
        acc[roomName].count += 1;
        const status = b.status?.toUpperCase();
        if (['CONFIRMED', 'PAID', 'COMPLETED'].includes(status)) {
            acc[roomName].revenue += Number(b.totalPrice || b.total || 0);
        }
        return acc;
    }, {});
    const sortedRooms = Object.entries(roomStats).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);

    // 3. Staff Performance (Mock logic)
    const staffMembers = users.filter(u => ['staff', 'manager'].includes(u.role));
    const staffStats = staffMembers.map(staff => ({
        name: staff.name,
        bookings: bookings.filter(b => b.createdBy === staff.id || b.actorId === staff.id).length,
        revenue: bookings.filter(b => (b.createdBy === staff.id || b.actorId === staff.id) && ['CONFIRMED', 'PAID', 'COMPLETED'].includes(b.status?.toUpperCase())).reduce((sum, b) => sum + Number(b.totalPrice || b.total || 0), 0)
    })).sort((a, b) => b.revenue - a.revenue);

    return (
        <div className="reports-page">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white m-0 uppercase tracking-tighter">{t('reportsAnalytics')}</h2>
                    <p className="text-gray-500 text-sm mt-1 font-medium">{t('reportsAnalyticsDesc')}</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        label={t('daily')}
                        className={`p-button-sm px-6 py-2 transition-all font-bold ${reportType === 'daily' ? 'p-button-primary shadow-lg shadow-blue-500/20' : 'p-button-outlined border-white/10 text-gray-400'}`}
                        onClick={() => setReportType('daily')}
                    />
                    <Button
                        label={t('monthly')}
                        className={`p-button-sm px-6 py-2 transition-all font-bold ${reportType === 'monthly' ? 'p-button-primary shadow-lg shadow-blue-500/20' : 'p-button-outlined border-white/10 text-gray-400'}`}
                        onClick={() => setReportType('monthly')}
                    />
                    <Button
                        icon="pi pi-download"
                        label={t('exportPdf')}
                        className="p-button-sm px-6 py-2 p-button-secondary p-button-outlined border-white/10 text-gray-400 font-bold"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card className="bg-[#1e1e2d] border border-white/5 shadow-xl lg:col-span-2" header={
                    <div className="p-4 border-b border-white/5">
                        <h3 className="m-0 text-lg font-bold text-white flex items-center gap-2">
                            <i className="pi pi-chart-bar text-[#4caf50]"></i> {t('revenueTrend')} ({reportType === 'daily' ? t('daily') : t('monthly')})
                        </h3>
                    </div>
                }>
                    <div className="flex items-flex-end h-[250px] gap-4 mt-4 px-2">
                        {displayKeys.length === 0 && (
                            <div className="flex-1 flex items-center justify-center text-gray-600 italic">
                                {t('noDataAvailable')}
                            </div>
                        )}
                        {displayKeys.map(key => {
                            const maxRev = Math.max(...Object.values(aggregatedData), 100000);
                            const height = Math.min((aggregatedData[key] / maxRev) * 100, 100);
                            return (
                                <div key={key} className="flex-1 flex flex-col items-center">
                                    <div className="relative w-full group h-full flex flex-col justify-end">
                                        <div
                                            className="w-full bg-gradient-to-t from-[#4caf50]/20 to-[#4caf50] rounded-t-lg transition-all duration-500 group-hover:brightness-125"
                                            style={{ height: `${height}%`, minHeight: '4px' }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-[10px] text-white py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                {Number(aggregatedData[key]).toLocaleString()}₮
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold mt-3 uppercase tracking-tighter truncate w-full text-center">
                                        {reportType === 'daily'
                                            ? new Date(key).toLocaleDateString(t('locale') === 'mn' ? 'mn-MN' : 'en-US', { weekday: 'short' })
                                            : new Date(key + '-01').toLocaleDateString(t('locale') === 'mn' ? 'mn-MN' : 'en-US', { month: 'short' })
                                        }
                                    </span>
                                    <span className="text-[8px] text-gray-500">
                                        {reportType === 'daily' ? key.slice(5) : key.split('-')[0]}
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
                            <i className="pi pi-star-fill text-[#ff9800]"></i> {t('topOperatingRooms')}
                        </h3>
                    </div>
                }>
                    <div className="space-y-4 pt-2">
                        {sortedRooms.length === 0 && <p className="text-gray-500 text-sm italic">{t('noBookingsFound')}</p>}
                        {sortedRooms.map(([name, stats], idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-[#ff9800] text-black' : 'bg-white/10 text-gray-400'}`}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="m-0 text-sm font-bold text-white">{name}</p>
                                        <p className="m-0 text-[10px] text-gray-500 font-bold uppercase">{t('totalBookingsStat', { count: stats.count })}</p>
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
                            <i className="pi pi-users text-[#b000ff]"></i> {t('repPerformance')}
                        </h3>
                    </div>
                }>
                    <div className="space-y-4 pt-2">
                        {staffStats.length === 0 && <p className="text-gray-500 text-sm italic">{t('noStaffFound')}</p>}
                        {staffStats.slice(0, 5).map((staff, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center font-bold text-xs uppercase">
                                        {staff.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="m-0 text-sm font-bold text-white">{staff.name}</p>
                                        <p className="m-0 text-[10px] text-gray-500 font-bold uppercase">{t('bookingsAssistedStat', { count: staff.bookings })}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="m-0 text-sm font-black text-[#eb79b2]">{Number(staff.revenue).toLocaleString()}₮</p>
                                    {idx === 0 && staff.revenue > 0 && <Tag value={t('mvp')} severity="warning" className="text-[8px] transform scale-75 origin-right" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <style>{`
                .reports-page .p-card-body {
                    padding: 1.5rem;
                }
            `}</style>
        </div>
    );
};

export default Reports;
