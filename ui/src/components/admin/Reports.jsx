import React from 'react';
import { useData } from '../../contexts/DataContext';

const Reports = () => {
    const { bookings, users, venues } = useData();

    // 1. Revenue Analysis
    const revenueByDate = bookings.reduce((acc, b) => {
        if (b.status === 'Confirmed' || b.status === 'Paid') {
            acc[b.date] = (acc[b.date] || 0) + b.total;
        }
        return acc;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(revenueByDate).sort();

    // 2. Top Rooms
    const roomStats = bookings.reduce((acc, b) => {
        if (!acc[b.roomName]) acc[b.roomName] = { revenue: 0, count: 0 };
        acc[b.roomName].count += 1;
        if (b.status === 'Confirmed') acc[b.roomName].revenue += b.total;
        return acc;
    }, {});
    const sortedRooms = Object.entries(roomStats).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);

    // 3. Staff Performance (Mock logic: Assuming 'user' field in mock bookings refers to staff for now, or just random)
    // Real logic would require 'createdBy' field in bookings.
    const staffStats = users.filter(u => u.role === 'staff').map(staff => ({
        name: staff.name,
        bookings: bookings.filter(b => Math.random() > 0.5).length, // MOCK: Random assignment for demo
        revenue: bookings.filter(b => Math.random() > 0.5).reduce((sum, b) => sum + b.total, 0) // MOCK
    }));

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Reports & Analytics</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-outline btn-sm">Daily</button>
                    <button className="btn btn-outline btn-sm active">Monthly</button>
                    <button className="btn btn-outline btn-sm">Export</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Revenue Chart (Simple CSS Bar Chart) */}
                <div style={{ background: '#2a2a2a', padding: '20px', borderRadius: '10px', gridColumn: 'span 2' }}>
                    <h3>Revenue Trend</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '10px', marginTop: '20px' }}>
                        {sortedDates.map(date => {
                            const height = Math.min((revenueByDate[date] / 500000) * 100, 100); // Scale
                            return (
                                <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '100%', height: `${height}%`, background: '#4CAF50', borderRadius: '4px 4px 0 0', minHeight: '4px' }}></div>
                                    <span style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '5px', writingMode: 'vertical-rl' }}>{date.slice(5)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Rooms */}
                <div style={{ background: '#2a2a2a', padding: '20px', borderRadius: '10px' }}>
                    <h3>Top Performing Rooms</h3>
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '15px' }}>
                        {sortedRooms.map(([name, stats], idx) => (
                            <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
                                <span>{idx + 1}. {name}</span>
                                <span style={{ color: '#FFC107' }}>
                                    {stats.revenue.toLocaleString()}₮ <small>({stats.count} bk)</small>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Staff Performance */}
                <div style={{ background: '#2a2a2a', padding: '20px', borderRadius: '10px' }}>
                    <h3>Staff Performance</h3>
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '15px' }}>
                        {staffStats.map((staff, idx) => (
                            <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>{staff.name}</span>
                                <span>{staff.bookings} bookings</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Reports;
