import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { api } from '../utils/api';
import AvatarGalleryPicker from '../components/common/AvatarGalleryPicker';

import BookingCountdown from '../components/BookingCountdown';

const CustomerProfile = () => {
    const {
        currentUser,
        bookings,
        venues,
        updateBookingStatus,
        logout,
        updateProfile,
        setShowResumeModal,
        setActiveBooking,
        extendBookingReservation,
        isExtending,
        activeBooking: globalActiveBooking
    } = useData();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('bookings');
    const [editForm, setEditForm] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        avatar: currentUser?.avatar || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    if (!currentUser) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <p className="text-white text-lg mb-4">{t('pleaseLogin')}</p>
                <Link to="/" className="text-[#b000ff] hover:text-[#eb79b2] transition-colors font-bold">{t('backToHome')}</Link>
            </div>
        </div>
    );

    const myBookings = bookings.filter(b => b.user === currentUser.name || b.userId === currentUser.id);
    const activeBookings = myBookings.filter(b => ['Pending', 'Confirmed', 'RESERVED', 'reserved', 'Reserved'].includes(b.status));
    const historyBookings = myBookings.filter(b => ['Completed', 'Cancelled', 'Refunded', 'EXPIRED', 'expired'].includes(b.status));

    const handleCancel = (id) => {
        confirmDialog({
            message: t('cancelBookingMessage'),
            header: t('cancelBookingHeader'),
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: t('yesCancel'),
            rejectLabel: t('goBack'),
            accept: () => updateBookingStatus(id, 'CANCELLED'),
        });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');
        try {
            await updateProfile(editForm);
            setMessage(t('profileUpdatedSuccess'));
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(t('profileUpdateFailed') + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a12] text-white">
            <ConfirmDialog />

            {/* Sticky Header */}
            <div className="sticky top-0 z-50 bg-[#0a0a12]/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between">
                <Link to="/" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors no-underline">
                    <i className="pi pi-home"></i>
                </Link>
                <h1 className="text-lg font-bold tracking-tight m-0">{t('profile') || 'Profile'}</h1>
                <Button
                    icon="pi pi-sign-out"
                    rounded
                    text
                    severity="secondary"
                    onClick={() => {
                        const redirectPath = logout();
                        navigate(redirectPath);
                    }}
                    className="w-10 h-10"
                />
            </div>

            <div className="max-w-xl mx-auto pb-24">
                {/* Profile Header Section */}
                <div className="flex flex-col items-center pt-8 pb-6 px-4">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#b000ff] to-[#eb79b2] p-1 shadow-[0_0_30px_rgba(176,0,255,0.3)]">
                            <div className="w-full h-full rounded-full bg-[#161622] overflow-hidden flex justify-center items-center text-3xl font-black">
                                {currentUser?.avatar ? (
                                    <img src={api.getFileUrl(currentUser.avatar)} alt={currentUser?.name} className="w-full h-full object-cover" />
                                ) : (
                                    currentUser?.name?.charAt(0) || 'U'
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#b000ff] border-4 border-[#0a0a12] flex items-center justify-center text-white text-xs hover:scale-110 transition-transform shadow-lg"
                        >
                            <i className="pi pi-pencil"></i>
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        <h2 className="text-2xl font-black m-0 tracking-tight">{currentUser?.name || 'User'}</h2>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="bg-yellow-500/10 text-yellow-400 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-yellow-500/20">
                                ⭐ {currentUser?.loyaltyPoints || 0} {t('pts')}
                            </span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                {t('memberSince', { year: currentUser?.createdAt ? new Date(currentUser.createdAt).getFullYear() : '2024' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Segmented Control Tabs */}
                <div className="px-4 sticky top-16 z-40 bg-[#0a0a12] py-4">
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'bookings', label: t('bookings'), icon: 'pi-calendar' },
                            { id: 'history', label: t('history'), icon: 'pi-history' },
                            { id: 'loyalty', label: t('rewards'), icon: 'pi-star' },
                            { id: 'settings', label: t('settings'), icon: 'pi-cog' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 min-w-fit ${activeTab === tab.id
                                    ? 'bg-white text-black shadow-lg shadow-white/10'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                <i className={`pi ${tab.icon} text-sm`}></i>
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-4 mt-2">
                    {/* Content */}
                    {activeTab === 'bookings' && (
                        <div className="space-y-4">
                            {activeBookings.length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                    <i className="pi pi-calendar text-3xl text-gray-700 mb-3"></i>
                                    <p className="text-gray-500 font-medium">{t('noUpcomingBookings')}</p>
                                </div>
                            ) : activeBookings.map(b => {
                                const isReserved = ['RESERVED', 'reserved', 'Reserved'].includes(b.status);
                                // Robust venue and room name resolution
                                const vFromRoom = b.room?.venue || venues.find(v => v.id === b.venueId || v.id === b.room?.venueId);
                                const venueName = vFromRoom?.name || b.venue?.name || 'Unknown Venue';
                                const roomName = b.room?.name || (typeof b.room === 'string' ? b.room : t('roomSelection'));

                                // Date, Time, Duration resolution
                                const bDate = b.date || (b.startTime && (b.startTime.toString().includes('-') || b.startTime.toString().includes('T')) ? new Date(b.startTime).toLocaleDateString('en-CA') : 'N/A');
                                const bTime = (b.startTime && (b.startTime.toString().includes('-') || b.startTime.toString().includes('T')))
                                    ? new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                                    : (b.startTime || b.time || 'N/A');

                                let bDuration = b.duration;
                                if (!bDuration && b.startTime && b.endTime) {
                                    const start = new Date(b.startTime);
                                    const end = new Date(b.endTime);
                                    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                        bDuration = Math.round((end - start) / 3600000 * 10) / 10;
                                    }
                                }
                                const displayDuration = bDuration || '1';

                                return (
                                    <div key={b.id} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden active:scale-[0.98] transition-all">
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-[#b000ff]/10 flex items-center justify-center text-[#b000ff]">
                                                        <i className="pi pi-calendar"></i>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-black m-0 tracking-tight">{roomName}</h3>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{venueName}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isReserved ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                                    {b.status}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-1 bg-black/20 rounded-xl p-3 mb-3 text-center">
                                                <div>
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t('date')}</p>
                                                    <p className="text-[11px] font-black">{bDate}</p>
                                                </div>
                                                <div className="border-x border-white/5">
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t('time')}</p>
                                                    <p className="text-[11px] font-black">{bTime}</p>
                                                </div>
                                                <div className="border-r border-white/5">
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t('hours')}</p>
                                                    <p className="text-[11px] font-black text-gray-300">{displayDuration}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t('total')}</p>
                                                    <p className="text-[11px] font-black text-[#b000ff]">{(Number(b.totalPrice) || Number(b.total) || 0).toLocaleString()}₮</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                {isReserved && (
                                                    <Button
                                                        label={t('payNow')}
                                                        icon="pi pi-credit-card"
                                                        className="flex-1 bg-white text-black border-none font-black text-[10px] tracking-widest h-10 rounded-xl"
                                                        onClick={() => {
                                                            setActiveBooking(b);
                                                            setShowResumeModal(true);
                                                        }}
                                                    />
                                                )}
                                                <Button
                                                    label={t('cancel')}
                                                    text
                                                    className="flex-1 text-[10px] font-black tracking-widest h-10 rounded-xl text-gray-500 hover:text-red-400"
                                                    onClick={() => handleCancel(b.id)}
                                                />
                                            </div>
                                        </div>

                                        {isReserved && (
                                            <div className="bg-[#b000ff]/5 px-4 py-3 border-t border-[#b000ff]/10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <i className="pi pi-clock text-xs text-yellow-500"></i>
                                                    <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{t('timeRemaining')}</span>
                                                </div>
                                                <BookingCountdown
                                                    booking={b}
                                                    isExtending={isExtending}
                                                    onExtend={() => extendBookingReservation(b.id)}
                                                    onExpired={() => window.location.reload()}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-3">
                            {historyBookings.length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                    <p className="text-gray-500 font-medium">{t('noBookingHistory')}</p>
                                </div>
                            ) : historyBookings.map(b => {
                                const vFromRoom = b.room?.venue || venues.find(v => v.id === b.venueId || v.id === b.room?.venueId);
                                const venueName = vFromRoom?.name || b.venue?.name || 'Unknown Venue';
                                const roomName = b.room?.name || (typeof b.room === 'string' ? b.room : t('roomSelection'));

                                // Date, Time, Duration resolution
                                const bDate = b.date || (b.startTime && (b.startTime.toString().includes('-') || b.startTime.toString().includes('T')) ? new Date(b.startTime).toLocaleDateString('en-CA') : 'N/A');
                                const bTime = (b.startTime && (b.startTime.toString().includes('-') || b.startTime.toString().includes('T')))
                                    ? new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                                    : (b.startTime || b.time || 'N/A');

                                let bDuration = b.duration;
                                if (!bDuration && b.startTime && b.endTime) {
                                    const start = new Date(b.startTime);
                                    const end = new Date(b.endTime);
                                    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                        bDuration = Math.round((end - start) / 3600000 * 10) / 10;
                                    }
                                }
                                const displayDuration = bDuration || '1';

                                const isCancelled = ['Cancelled', 'cancelled', 'CANCELLED', 'EXPIRED', 'expired'].includes(b.status);

                                return (
                                    <div key={b.id} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden opacity-80">
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center text-gray-500 text-xs">
                                                        <i className={`pi ${isCancelled ? 'pi-times-circle' : 'pi-check-circle'}`}></i>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xs font-black m-0 tracking-tight">{roomName}</h3>
                                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{venueName}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${isCancelled ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                                                    {b.status}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-1 bg-black/10 rounded-xl p-2 text-center">
                                                <div>
                                                    <p className="text-[8px] text-gray-600 font-bold uppercase mb-1">{t('date')}</p>
                                                    <p className="text-[10px] font-bold text-gray-400">{bDate}</p>
                                                </div>
                                                <div className="border-x border-white/5">
                                                    <p className="text-[8px] text-gray-600 font-bold uppercase mb-1">{t('time')}</p>
                                                    <p className="text-[10px] font-bold text-gray-400">{bTime}</p>
                                                </div>
                                                <div className="border-r border-white/5">
                                                    <p className="text-[8px] text-gray-600 font-bold uppercase mb-1">{t('hours').slice(0, 3)}</p>
                                                    <p className="text-[10px] font-bold text-gray-400">{displayDuration}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-gray-600 font-bold uppercase mb-1">{t('total')}</p>
                                                    <p className="text-[10px] font-bold text-gray-400">{(Number(b.totalPrice) || Number(b.total) || 0).toLocaleString()}₮</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'loyalty' && (
                        <div className="bg-gradient-to-br from-[#b000ff]/20 to-[#eb79b2]/20 p-8 rounded-3xl border border-white/10 text-center relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#b000ff] blur-[80px] opacity-20"></div>
                            <div className="relative z-10">
                                <i className="pi pi-star-fill text-4xl text-yellow-400 mb-4 inline-block drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]"></i>
                                <h2 className="text-3xl font-black m-0 tracking-tight text-white uppercase italic">{t('goldTier')}</h2>
                                <div className="my-8">
                                    <p className="text-[10px] text-[#b000ff] font-black uppercase tracking-[0.2em] mb-2">{t('currentBalance')}</p>
                                    <span className="text-5xl font-black text-white">{currentUser.loyaltyPoints}</span>
                                    <span className="text-xs font-bold text-gray-500 ml-2">{t('pts')}</span>
                                </div>
                                <div className="w-full h-2 bg-black/40 rounded-full mb-4 p-0.5 border border-white/5">
                                    <div className="w-[45%] h-full bg-gradient-to-r from-[#b000ff] to-[#eb79b2] rounded-full shadow-[0_0_10px_rgba(176,0,255,0.5)]"></div>
                                </div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{t('pointsToNextTier', { points: 450 })}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-1.5 h-6 bg-[#b000ff] rounded-full"></div>
                                <h2 className="text-xl font-black m-0 tracking-tight">{t('editProfile')}</h2>
                            </div>

                            <div className="flex justify-center mb-10">
                                <div className="relative">
                                    <AvatarGalleryPicker
                                        currentAvatar={editForm.avatar}
                                        onSelect={(url) => setEditForm({ ...editForm, avatar: url })}
                                    />
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">{t('fullName')}</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:border-[#b000ff] transition-all"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">{t('email')}</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:border-[#b000ff] transition-all"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">{t('phoneNumber')}</label>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:border-[#b000ff] transition-all"
                                    />
                                </div>

                                {message && (
                                    <div className={`p-4 rounded-2xl text-xs font-bold text-center ${message.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                                        {message}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    label={isSaving ? t('saving') : t('saveChanges')}
                                    disabled={isSaving}
                                    className="w-full h-14 bg-[#b000ff] text-white border-none font-black text-xs tracking-widest rounded-2xl shadow-[0_10px_20px_rgba(176,0,255,0.2)] active:scale-95 transition-all mt-4"
                                />
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerProfile;
