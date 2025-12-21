import React from 'react';
import { useData } from '../../contexts/DataContext';

const AdminDashboard = () => {
    const { bookings, venues } = useData();

    // Dashboard Stats
    const totalRevenue = bookings.reduce((sum, b) => b.status === 'Confirmed' || b.status === 'Paid' ? sum + b.total : sum, 0);

    return (
        <div>
            <h2>Dashboard Overview</h2>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: '#2a2a2a', padding: '20px', borderRadius: '10px' }}>
                    <h3>Today's Bookings</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{bookings.length}</p>
                </div>
                <div style={{ background: '#2a2a2a', padding: '20px', borderRadius: '10px' }}>
                    <h3>Total Revenue</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4CAF50' }}>{totalRevenue.toLocaleString()}₮</p>
                </div>
                <div style={{ background: '#2a2a2a', padding: '20px', borderRadius: '10px' }}>
                    <h3>Active Venues</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{venues.length}</p>
                </div>
            </div>

            <div style={{ background: '#2a2a2a', padding: '20px', borderRadius: '10px' }}>
                <h3>Quick Actions</h3>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button className="btn btn-primary">Create Booking</button>
                    <button className="btn btn-outline">View Reports</button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
