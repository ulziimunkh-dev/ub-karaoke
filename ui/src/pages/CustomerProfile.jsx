import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Button } from 'primereact/button';

const CustomerProfile = () => {
    const { currentUser, bookings, updateBookingStatus, logout, updateProfile } = useData();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('bookings');
    const [editForm, setEditForm] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    if (!currentUser) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <p className="text-white text-lg mb-4">Please log in.</p>
                <Link to="/" className="text-[#b000ff] hover:text-[#eb79b2] transition-colors font-bold">Back to Home</Link>
            </div>
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
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <Link to="/" className="text-[#b000ff] hover:text-[#eb79b2] transition-colors text-sm font-medium flex items-center gap-2">
                    ← Home
                </Link>
                <Button
                    label="Logout"
                    outlined
                    onClick={() => {
                        const redirectPath = logout();
                        navigate(redirectPath);
                    }}
                    className="h-10 px-5"
                />
            </div>

            <div className="flex items-center mb-8 bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#b000ff] to-[#eb79b2] flex justify-center items-center text-2xl font-bold">
                    {currentUser?.name?.charAt(0) || 'U'}
                </div>
                <div className="ml-6 flex-1">
                    <h1 className="text-3xl font-bold m-0">{currentUser?.name || 'User'}</h1>
                    <p className="text-gray-400 my-1">Member since 2024</p>
                    <div className="flex items-center gap-3">
                        <span className="text-yellow-400 font-bold">⭐ {currentUser?.loyaltyPoints || 0} Points</span>
                        <span className="text-xs text-gray-600">(Gold Tier)</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-white/10 mb-8">
                <button
                    onClick={() => setActiveTab('bookings')}
                    className={`bg-transparent border-none px-5 py-3 text-lg cursor-pointer transition-all ${activeTab === 'bookings'
                        ? 'text-[#b000ff] border-b-2 border-[#b000ff] font-bold'
                        : 'text-gray-400 hover:text-[#b000ff]'
                        }`}
                >
                    My Bookings
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`bg-transparent border-none px-5 py-3 text-lg cursor-pointer transition-all ${activeTab === 'history'
                        ? 'text-[#b000ff] border-b-2 border-[#b000ff] font-bold'
                        : 'text-gray-400 hover:text-[#b000ff]'
                        }`}
                >
                    History
                </button>
                <button
                    onClick={() => setActiveTab('loyalty')}
                    className={`bg-transparent border-none px-5 py-3 text-lg cursor-pointer transition-all ${activeTab === 'loyalty'
                        ? 'text-[#b000ff] border-b-2 border-[#b000ff] font-bold'
                        : 'text-gray-400 hover:text-[#b000ff]'
                        }`}
                >
                    Loyalty & Rewards
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`bg-transparent border-none px-5 py-3 text-lg cursor-pointer transition-all ${activeTab === 'settings'
                        ? 'text-[#b000ff] border-b-2 border-[#b000ff] font-bold'
                        : 'text-gray-400 hover:text-[#b000ff]'
                        }`}
                >
                    Settings
                </button>
            </div>

            {/* Content */}
            {activeTab === 'bookings' && (
                <div className="grid gap-5">
                    {activeBookings.length === 0 ? <p className="text-gray-500">No upcoming bookings.</p> : activeBookings.map(b => (
                        <div key={b.id} className="bg-white/5 p-5 rounded-xl flex justify-between items-center border-l-4 border-green-500">
                            <div>
                                <h3 className="text-xl font-bold m-0 mb-1">{b.room?.name || 'Booking'}</h3>
                                <p className="text-gray-400 my-1">{b.date} at {b.startTime || b.time}</p>
                                <p className="font-bold my-1">{(Number(b.totalPrice) || Number(b.total) || 0).toLocaleString()}₮</p>
                                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold">{b.status}</span>
                            </div>
                            <Button
                                label="Cancel Booking"
                                severity="danger"
                                outlined
                                onClick={() => handleCancel(b.id)}
                                className="text-xs"
                                size="small"
                            />
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="grid gap-5">
                    {historyBookings.length === 0 ? <p className="text-gray-500">No booking history.</p> : historyBookings.map(b => (
                        <div key={b.id} className="bg-white/5 p-5 rounded-xl flex justify-between items-center border-l-4 border-gray-500">
                            <div>
                                <h3 className="text-xl font-bold text-gray-400 m-0 mb-1">{b.room?.name || 'Booking'}</h3>
                                <p className="text-gray-600 my-1">{b.date}</p>
                                <span className="bg-gray-700 text-gray-400 px-2 py-1 rounded text-xs font-bold">{b.status}</span>
                            </div>
                            <Button
                                label="Write Review"
                                outlined
                                onClick={() => alert('Review coming soon!')}
                                className="text-xs"
                                size="small"
                            />
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'loyalty' && (
                <div className="text-center p-10 bg-white/5 rounded-xl border border-white/10">
                    <h2 className="text-3xl font-bold text-yellow-400 mb-4">Gold Member</h2>
                    <p className="text-lg">You have earned <strong className="text-[#b000ff]">{currentUser.loyaltyPoints} points</strong>.</p>
                    <div className="w-full h-3 bg-white/10 rounded-full my-6 overflow-hidden">
                        <div className="w-[45%] h-full bg-gradient-to-r from-[#b000ff] to-[#eb79b2]"></div>
                    </div>
                    <p className="text-sm text-gray-400">450 points to Platinum Tier</p>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="max-w-xl mx-auto bg-white/5 p-8 rounded-xl border border-white/10">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold m-0">Profile Settings</h2>
                        <button
                            onClick={() => setActiveTab('bookings')}
                            className="bg-transparent border-none text-gray-400 hover:text-white cursor-pointer text-2xl transition-colors"
                            title="Back to Bookings"
                        >
                            ✕
                        </button>
                    </div>
                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400 font-medium">Full Name</label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                className="p-3 bg-[#151521] border border-[#2A2A35] rounded-lg text-white focus:outline-none focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff]/30 transition-all"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400 font-medium">Email Address</label>
                            <input
                                type="email"
                                value={editForm.email}
                                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                className="p-3 bg-[#151521] border border-[#2A2A35] rounded-lg text-white focus:outline-none focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff]/30 transition-all"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400 font-medium">Phone Number</label>
                            <input
                                type="text"
                                value={editForm.phone}
                                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                className="p-3 bg-[#151521] border border-[#2A2A35] rounded-lg text-white focus:outline-none focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff]/30 transition-all"
                            />
                        </div>
                        {message && <p className={`text-sm ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
                        <Button
                            type="submit"
                            label={isSaving ? 'Saving...' : 'Update Profile'}
                            disabled={isSaving}
                            className="h-12 px-6"
                        />
                    </form>
                </div>
            )}
        </div >
    );
};

export default CustomerProfile;
