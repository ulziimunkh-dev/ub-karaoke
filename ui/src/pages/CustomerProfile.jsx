import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

const CustomerProfile = () => {
    const { currentUser, bookings, updateBookingStatus, logout, updateProfile } = useData();
    const [activeTab, setActiveTab] = useState('bookings');
    const [editForm, setEditForm] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    if (!currentUser) return (
        <div style={{ padding: '50px', color: 'white', textAlign: 'center' }}>
            <p>Please log in.</p>
            <Link to="/" style={{ color: '#E91E63', textDecoration: 'none', marginTop: '20px', display: 'inline-block' }}>Back to Home</Link>
        </div>
    );

    const myBookings = bookings.filter(b => b.user === currentUser.name || b.userId === currentUser.id);
    const activeBookings = myBookings.filter(b => ['Pending', 'Confirmed'].includes(b.status));
    const historyBookings = myBookings.filter(b => ['Completed', 'Cancelled', 'Refunded'].includes(b.status));

    const handleCancel = (id) => {
        if (window.confirm('Are you sure you want to cancel this booking? Cancellation fees may apply.')) {
            updateBookingStatus(id, 'Cancelled');
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');
        try {
            await updateProfile(editForm);
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Failed to update profile: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', color: 'white' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <Link to="/" style={{ color: '#aaa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>🏠</span> Home
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={logout} className="btn btn-outline btn-sm">Logout</button>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', background: '#222', padding: '20px', borderRadius: '15px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#E91E63', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                    {currentUser.name.charAt(0)}
                </div>
                <div style={{ marginLeft: '20px', flex: 1 }}>
                    <h1 style={{ margin: 0 }}>{currentUser.name}</h1>
                    <p style={{ color: '#aaa', margin: '5px 0' }}>Member since 2024</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#FFC107', fontWeight: 'bold' }}>⭐ {currentUser.loyaltyPoints || 0} Points</span>
                        <span style={{ fontSize: '0.8rem', color: '#666' }}> (Gold Tier)</span>
                    </div>
                </div>
                <button onClick={logout} className="btn btn-outline">Logout</button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ borderBottom: '1px solid #333', marginBottom: '30px' }}>
                <button
                    onClick={() => setActiveTab('bookings')}
                    style={{
                        background: 'none', border: 'none', color: activeTab === 'bookings' ? '#E91E63' : '#aaa',
                        padding: '10px 20px', fontSize: '1.1rem', cursor: 'pointer',
                        borderBottom: activeTab === 'bookings' ? '2px solid #E91E63' : 'none'
                    }}
                >
                    My Bookings
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    style={{
                        background: 'none', border: 'none', color: activeTab === 'history' ? '#E91E63' : '#aaa',
                        padding: '10px 20px', fontSize: '1.1rem', cursor: 'pointer',
                        borderBottom: activeTab === 'history' ? '2px solid #E91E63' : 'none'
                    }}
                >
                    History
                </button>
                <button
                    onClick={() => setActiveTab('loyalty')}
                    style={{
                        background: 'none', border: 'none', color: activeTab === 'loyalty' ? '#E91E63' : '#aaa',
                        padding: '10px 20px', fontSize: '1.1rem', cursor: 'pointer',
                        borderBottom: activeTab === 'loyalty' ? '2px solid #E91E63' : 'none'
                    }}
                >
                    Loyalty & Rewards
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    style={{
                        background: 'none', border: 'none', color: activeTab === 'settings' ? '#E91E63' : '#aaa',
                        padding: '10px 20px', fontSize: '1.1rem', cursor: 'pointer',
                        borderBottom: activeTab === 'settings' ? '2px solid #E91E63' : 'none'
                    }}
                >
                    Settings
                </button>
            </div>

            {/* Content */}
            {activeTab === 'bookings' && (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {activeBookings.length === 0 ? <p style={{ color: '#888' }}>No upcoming bookings.</p> : activeBookings.map(b => (
                        <div key={b.id} style={{ background: '#222', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '5px solid #4CAF50' }}>
                            <div>
                                <h3>{b.roomName}</h3>
                                <p style={{ color: '#aaa', margin: '5px 0' }}>{b.date} at {b.time}</p>
                                <p style={{ fontWeight: 'bold' }}>{b.total.toLocaleString()}₮</p>
                                <span style={{ background: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{b.status}</span>
                            </div>
                            <button className="btn btn-outline" style={{ borderColor: '#F44336', color: '#F44336' }} onClick={() => handleCancel(b.id)}>Cancel Booking</button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'history' && (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {historyBookings.length === 0 ? <p style={{ color: '#888' }}>No booking history.</p> : historyBookings.map(b => (
                        <div key={b.id} style={{ background: '#222', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '5px solid #888' }}>
                            <div>
                                <h3 style={{ color: '#aaa' }}>{b.roomName}</h3>
                                <p style={{ color: '#666', margin: '5px 0' }}>{b.date}</p>
                                <span style={{ background: '#333', color: '#aaa', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{b.status}</span>
                            </div>
                            <button className="btn btn-sm btn-outline">Write Review</button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'loyalty' && (
                <div style={{ textAlign: 'center', padding: '40px', background: '#222', borderRadius: '10px' }}>
                    <h2 style={{ color: '#FFC107' }}>Gold Member</h2>
                    <p>You have earned <strong>{currentUser.loyaltyPoints} points</strong>.</p>
                    <div style={{ width: '100%', height: '10px', background: '#333', borderRadius: '5px', margin: '20px 0', overflow: 'hidden' }}>
                        <div style={{ width: '45%', height: '100%', background: '#FFC107' }}></div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#aaa' }}>450 points to Platinum Tier</p>
                </div>
            )}

            {activeTab === 'settings' && (
                <div style={{ maxWidth: '500px', margin: '0 auto', background: '#222', padding: '30px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ margin: 0 }}>Profile Settings</h2>
                        <button
                            onClick={() => setActiveTab('bookings')}
                            style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.5rem' }}
                            title="Back to Bookings"
                        >
                            ✕
                        </button>
                    </div>
                    <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.9rem', color: '#aaa' }}>Full Name</label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                style={{ padding: '12px', background: '#333', border: 'none', borderRadius: '6px', color: 'white' }}
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.9rem', color: '#aaa' }}>Email Address</label>
                            <input
                                type="email"
                                value={editForm.email}
                                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                style={{ padding: '12px', background: '#333', border: 'none', borderRadius: '6px', color: 'white' }}
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.9rem', color: '#aaa' }}>Phone Number</label>
                            <input
                                type="text"
                                value={editForm.phone}
                                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                style={{ padding: '12px', background: '#333', border: 'none', borderRadius: '6px', color: 'white' }}
                            />
                        </div>
                        {message && <p style={{ color: message.includes('success') ? '#4CAF50' : '#F44336', fontSize: '0.9rem' }}>{message}</p>}
                        <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ padding: '12px', marginTop: '10px' }}>
                            {isSaving ? 'Saving...' : 'Update Profile'}
                        </button>
                    </form>
                </div>
            )}
        </div >
    );
};

export default CustomerProfile;
