import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { DataView } from 'primereact/dataview';
import { Divider } from 'primereact/divider';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { api } from '../utils/api';

import AuditLogViewer from './staff/AuditLogViewer';
import ProfileModal from './common/ProfileModal';

const StaffPortal = () => {
    const {
        venues, bookings, updateRoomStatus, updateBookingStatus, updateBooking,
        updateVenue, addOrder, currentUser, logout,
        activeVenueId, setActiveVenueId, createManualBooking, updateRoom, updateStaff
    } = useData();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const toast = useRef(null);

    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('pos');
    const [modalTab, setModalTab] = useState('actions'); // 'actions' | 'schedule'
    const [scheduleFilter, setScheduleFilter] = useState('today'); // today, tomorrow, yesterday, week, month
    const [activeBooking, setActiveBooking] = useState(null);

    // Manual Booking State
    const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // New Profile State
    const [manualBookingData, setManualBookingData] = useState({
        customerName: '',
        phoneNumber: '',
        hours: 2,
        startTime: ''
    });

    const handleManualBooking = (room) => {
        setSelectedRoom(room);
        setManualBookingData({
            customerName: '',
            phoneNumber: '',
            hours: 2,
            startTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        });
        setIsManualBookingOpen(true);
    };

    const submitManualBooking = async () => {
        if (!manualBookingData.startTime) {
            toast.current.show({ severity: 'warn', summary: 'Missing Info', detail: 'Please fill in start time.' });
            return;
        }

        const finalCustomerName = manualBookingData.customerName.trim() || 'Walk-in Guest';

        try {
            const today = new Date().toISOString().split('T')[0];
            const bookingPayload = {
                venueId: selectedVenue.id,
                roomId: selectedRoom.id,
                date: today,
                startTime: manualBookingData.startTime,
                duration: manualBookingData.hours, // Backend expects 'duration' but mapped to endTime calc usually, let's assume valid dto
                customerName: finalCustomerName,
                customerPhone: manualBookingData.phoneNumber,
                source: 'WALK_IN'
            };

            // Calculate End Time properly
            const [h, m] = manualBookingData.startTime.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(h, m, 0, 0);

            const endDate = new Date(startDate);
            endDate.setHours(h + manualBookingData.hours);

            const endTime = endDate.toTimeString().split(' ')[0]; // HH:MM:SS

            await createManualBooking({
                ...bookingPayload,
                endTime, // Overwriting or ensuring end time is set
                totalPrice: (Number(selectedRoom.hourlyRate) || 15000) * Number(manualBookingData.hours)
            });

            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Walk-in booking created.' });
            setIsManualBookingOpen(false);
            // Refresh logic usually handled by context socket or poll, assuming useData updates locally
        } catch (e) {
            console.error(e);
            // Extract meaningful error message
            let errorMessage = 'Failed to create booking.';
            if (e.response?.data?.message) {
                errorMessage = Array.isArray(e.response.data.message)
                    ? e.response.data.message.join(', ')
                    : e.response.data.message;
            }
            toast.current.show({ severity: 'error', summary: 'Error', detail: errorMessage });
        }
    };

    // Filter venues for this organization
    const orgVenues = currentUser.role === 'sysadmin' ? venues : venues.filter(v => v.organizationId === currentUser.organizationId);
    const selectedVenue = venues.find(v => v.id === activeVenueId) || orgVenues[0];

    useEffect(() => {
        if (!activeVenueId && orgVenues.length > 0) {
            setActiveVenueId(orgVenues[0].id);
        }
    }, [activeVenueId, orgVenues]);

    const getActiveBooking = (venueId, roomId) => {
        return bookings.find(b =>
            b.venueId === venueId &&
            b.roomId === roomId &&
            ['CONFIRMED', 'CHECKED_IN'].includes(b.status)
        );
    };

    const getFilteredBookings = () => {
        if (!selectedRoom) return [];

        // Strict string conversion for IDs
        const roomBookings = bookings.filter(b => String(b.roomId) === String(selectedRoom.id));

        // Helper to get local date string YYYY-MM-DD
        const toLocalYMD = (date) => {
            const d = new Date(date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };

        const todayStr = toLocalYMD(new Date());

        return roomBookings.filter(b => {
            if (!b.date && !b.startTime) return false;

            const bDateStr = toLocalYMD(b.date || b.startTime);

            // Calculate Day Diff by parsing UTC strings to avoid timezone shifts
            const d1 = new Date(bDateStr);
            const d2 = new Date(todayStr);
            const diffTime = d1 - d2;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (scheduleFilter === 'today') return diffDays === 0;
            if (scheduleFilter === 'tomorrow') return diffDays === 1;
            if (scheduleFilter === 'yesterday') return diffDays === -1;
            if (scheduleFilter === 'week') return diffDays >= -7 && diffDays <= 7;
            if (scheduleFilter === 'month') return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

            return false;
        }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    };

    const handleRoomClick = (room) => {
        const booking = getActiveBooking(selectedVenue.id, room.id);
        setSelectedRoom(room);
        setActiveBooking(booking);
        setModalTab('actions'); // Reset to actions tab
        setIsActionModalOpen(true);
    };

    const handleCheckIn = async () => {
        if (activeBooking) {
            try {
                await updateBookingStatus(activeBooking.id, 'CHECKED_IN');
                await updateRoomStatus(selectedVenue.id, selectedRoom.id, 'Occupied');
                setIsActionModalOpen(false);
                toast.current.show({ severity: 'success', summary: 'Checked In', detail: `${selectedRoom.name} is now occupied.` });
            } catch (error) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Check-in failed' });
            }
        }
    };

    const handleCheckOut = async () => {
        if (activeBooking) {
            try {
                await updateBookingStatus(activeBooking.id, 'COMPLETED');
                await updateRoomStatus(selectedVenue.id, selectedRoom.id, 'Cleaning');
                setIsActionModalOpen(false);
                toast.current.show({ severity: 'success', summary: 'Checked Out', detail: `${selectedRoom.name} is now awaiting cleaning.` });
            } catch (error) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Check-out failed' });
            }
        }
    };

    const handleQuickOrder = (item) => {
        addOrder(activeBooking.id, [item]);
        toast.current.show({ severity: 'info', summary: 'Item Added', detail: `${item.name} added to order.` });
    };

    const handleFinishCleaning = async (room) => {
        await updateRoomStatus(selectedVenue.id, room.id, 'Available');
        toast.current.show({ severity: 'success', summary: 'Ready', detail: `${room.name} is now available.` });
    };

    const getStatusSeverity = (status) => {
        switch (status) {
            case 'Available': return 'success';
            case 'Occupied': return 'danger';
            case 'Cleaning': return 'warning';
            case 'Maintenance': return 'info';
            default: return null;
        }
    };

    const posItems = [
        { name: 'Sengur (Bottle)', price: 7000, category: 'Drinks' },
        { name: 'Heineken (Bottle)', price: 9000, category: 'Drinks' },
        { name: 'Coca Cola 0.5L', price: 3500, category: 'Drinks' },
        { name: 'Water 0.5L', price: 2000, category: 'Drinks' },
        { name: 'Mixed Nuts', price: 15000, category: 'Snacks' },
        { name: 'Fruit Platter', price: 45000, category: 'Food' },
        { name: 'French Fries', price: 12000, category: 'Food' },
    ];

    const formatTime = (dateString, timeString) => {
        if (!dateString) return '--:--';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return timeString || '--:--';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const getDuration = (start, end) => {
        if (!start || !end) return '';
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        const diff = (endTime - startTime) / (1000 * 60 * 60); // Hours
        return diff > 0 ? `(${diff.toFixed(1).replace(/\.0$/, '')}h)` : '';
    };

    return (
        <div className="staff-portal">
            <Toast ref={toast} />

            <div className="flex justify-between items-center mb-6 bg-[#1e1e2d] p-4 rounded-xl border border-white/5">
                <div>
                    <h2 className="text-xl font-black text-white m-0 uppercase tracking-tighter">
                        Room Dashboard <span className="text-[#b000ff]">POS</span>
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest m-0">
                            Viewing {selectedVenue?.name}
                        </p>
                        <span className="text-gray-700">|</span>
                        <Button
                            icon={`pi ${selectedVenue?.isBookingEnabled === false ? 'pi-lock' : 'pi-globe'}`}
                            className={`p-button-rounded p-button-text p-button-sm w-6 h-6 ${selectedVenue?.isBookingEnabled === false ? 'text-red-400 bg-red-500/10' : 'text-green-400 bg-green-500/10'}`}
                            tooltip={selectedVenue?.isBookingEnabled === false ? "Enable Venue (Go Online)" : "Disable Venue (Go Offline)"}
                            onClick={() => updateVenue(selectedVenue?.id, { isBookingEnabled: selectedVenue?.isBookingEnabled === false })}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div
                        className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-all"
                        onClick={() => setIsProfileModalOpen(true)}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#b000ff] to-[#5d00ff] flex items-center justify-center text-white font-bold shadow-lg overflow-hidden">
                            {currentUser?.avatar ? (
                                <img src={api.getFileUrl(currentUser.avatar)} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                (currentUser?.firstName?.[0] || currentUser?.username?.[0] || 'S').toUpperCase()
                            )}
                        </div>
                        <div className="hidden md:block text-right">
                            <p className="text-white text-xs font-bold m-0 leading-tight">
                                {currentUser?.firstName || currentUser?.username || 'Staff'}
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono m-0 leading-tight uppercase">
                                {currentUser?.role || 'Staff'}
                            </p>
                        </div>
                    </div>
                    <div className="h-6 w-[1px] bg-white/10"></div>
                    <Button
                        icon="pi pi-power-off"
                        className="p-button-rounded p-button-danger p-button-text hover:bg-red-500/10"
                        onClick={() => {
                            logout();
                            navigate('/staff/login');
                        }}
                        tooltip={`Sign Out (${currentUser?.firstName || 'Staff'})`}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {selectedVenue?.rooms.map(room => (
                    <Card
                        key={room.id}
                        className={`cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border-none shadow-xl ${room.status === 'Occupied' ? 'bg-[#2d1e2a]' : 'bg-[#1e1e2d]'}`}
                        onClick={() => room.status === 'Cleaning' ? handleFinishCleaning(room) : handleRoomClick(room)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="m-0 text-lg font-black text-white">{room.name}</h3>
                            <Tag value={room.status} severity={getStatusSeverity(room.status)} />
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                            {/* Room Level Online Status Toggle */}
                            <Button
                                icon={`pi ${room.isBookingEnabled === false ? 'pi-lock' : 'pi-globe'}`}
                                className={`p-button-rounded p-button-text p-button-sm w-8 h-8 ${room.isBookingEnabled === false ? 'text-red-400 bg-red-500/10' : 'text-green-400 bg-green-500/10'}`}
                                tooltip={room.isBookingEnabled === false ? "Enable Online Booking" : "Disable Online Booking"}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateRoom(selectedVenue.id, room.id, { isBookingEnabled: room.isBookingEnabled === false }); // Toggle
                                }}
                            />
                            <span className="text-[10px] text-gray-500 uppercase font-bold">
                                {room.isBookingEnabled === false ? 'Offline' : 'Online'}
                            </span>
                        </div>

                        {getActiveBooking(selectedVenue.id, room.id) ? (
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Active Booking</span>
                                <span className="text-sm font-bold text-white truncate">
                                    {getActiveBooking(selectedVenue.id, room.id).customerName}
                                </span>
                                <span className="text-[10px] text-[#b000ff] font-black uppercase">
                                    {formatTime(getActiveBooking(selectedVenue.id, room.id).startTime)} {getDuration(getActiveBooking(selectedVenue.id, room.id).startTime, getActiveBooking(selectedVenue.id, room.id).endTime)}
                                </span>
                            </div>
                        ) : (
                            <div className="h-10 flex items-center">
                                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest italic">No active session</span>
                            </div>
                        )}

                        {room.status === 'Cleaning' && (
                            <div className="mt-4 pt-4 border-t border-white/5 text-center">
                                <span className="text-[10px] text-orange-400 font-black uppercase heartbeat">Tap to finish cleaning</span>
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* Room Action Modal */}
            <Dialog
                header={`Room Control: ${selectedRoom?.name}`}
                visible={isActionModalOpen}
                className="w-full max-w-4xl"
                onHide={() => setIsActionModalOpen(false)}
                modal
            >
                <div className="flex gap-1 bg-black/20 p-1 rounded-xl mb-6 mx-auto max-w-sm">
                    {['actions', 'schedule'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setModalTab(tab)}
                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${modalTab === tab ? 'bg-[#b000ff] text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {modalTab === 'actions' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Session Info */}
                        <div>
                            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="m-0 text-gray-500 uppercase text-xs font-black tracking-widest">Current Status</h4>
                                    <Tag value={selectedRoom?.status} severity={getStatusSeverity(selectedRoom?.status)} />
                                </div>

                                {activeBooking ? (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase m-0">Customer</p>
                                            <p className="text-xl font-black text-white m-0">{activeBooking.customerName}</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 font-bold uppercase m-0">Start</p>
                                                <p className="text-sm font-bold text-white m-0">{formatTime(activeBooking.startTime)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-bold uppercase m-0">Duration</p>
                                                <p className="text-sm font-bold text-white m-0">
                                                    {getDuration(activeBooking.startTime, activeBooking.endTime).replace(/[()]/g, '')}
                                                </p>
                                            </div>
                                        </div>
                                        <Divider className="border-white/5" />
                                        <div className="flex justify-between items-end">
                                            <p className="text-xs text-gray-500 font-bold uppercase m-0">Total Bill</p>
                                            <p className="text-3xl font-black text-green-400 m-0">
                                                {Number(activeBooking.totalPrice).toLocaleString()}₮
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <i className="pi pi-calendar-times text-4xl text-gray-700 mb-3" />
                                        <p className="text-gray-500 font-bold uppercase text-xs">No Active Booking Found</p>
                                        <Button
                                            label="Create Manual Walk-in"
                                            icon="pi pi-plus"
                                            className="p-button-outlined p-button-sm mt-4 hover:bg-[#b000ff]/10 hover:text-[#b000ff] hover:border-[#b000ff]"
                                            onClick={() => handleManualBooking(selectedRoom)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                {activeBooking?.status === 'CONFIRMED' && (
                                    <Button label="CHECK-IN GUEST" icon="pi pi-sign-in" className="p-button-lg p-button-success font-black h-16 shadow-lg shadow-green-500/20" onClick={handleCheckIn} />
                                )}
                                {activeBooking?.status === 'CHECKED_IN' && (
                                    <Button label="COMPLETE & CHECK-OUT" icon="pi pi-sign-out" className="p-button-lg p-button-danger font-black h-16 shadow-lg shadow-red-500/20" onClick={handleCheckOut} />
                                )}
                            </div>
                        </div>

                        {/* POS Actions */}
                        <div className="bg-[#1e1e2d] p-6 rounded-2xl border border-white/5">
                            <h4 className="m-0 text-gray-500 uppercase text-xs font-black tracking-widest mb-4">Point of Sale (Quick Services)</h4>

                            {activeBooking?.status === 'CHECKED_IN' ? (
                                <div className="flex flex-col gap-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            label="+ 1 Hour"
                                            icon="pi pi-clock"
                                            className="p-button-outlined p-button-info p-button-sm"
                                            onClick={async () => {
                                                if (!activeBooking) return;
                                                try {
                                                    const currentEnd = new Date(activeBooking.endTime);
                                                    currentEnd.setHours(currentEnd.getHours() + 1);

                                                    // Calculate new price
                                                    const hourlyRate = Number(selectedRoom.hourlyRate);
                                                    const currentPrice = Number(activeBooking.totalPrice);
                                                    const newPrice = currentPrice + hourlyRate;

                                                    await updateBooking(activeBooking.id, {
                                                        endTime: currentEnd.toISOString(),
                                                        totalPrice: newPrice
                                                    });

                                                    toast.current.show({ severity: 'success', summary: 'Extended', detail: 'Booking extended by 1 hour.' });
                                                } catch (e) {
                                                    console.error(e);
                                                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to extend booking.' });
                                                }
                                            }}
                                        />
                                        <Button label="Extra Mic" icon="pi pi-microphone" className="p-button-outlined p-button-info p-button-sm" />
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">Popular Items</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {posItems.map(item => (
                                                <button
                                                    key={item.name}
                                                    onClick={() => handleQuickOrder(item)}
                                                    className="bg-black/40 hover:bg-[#b000ff]/20 border border-white/5 hover:border-[#b000ff]/50 p-3 rounded-xl transition-all text-left group"
                                                >
                                                    <p className="text-xs font-bold text-white m-0 group-hover:text-[#eb79b2]">{item.name}</p>
                                                    <p className="text-[10px] text-gray-500 m-0 font-mono mt-1">{item.price.toLocaleString()}₮</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <i className="pi pi-lock text-4xl text-gray-800 mb-4" />
                                    <p className="text-gray-600 text-sm font-bold italic">Check-in guest to enable POS services.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-[60vh] flex flex-col">
                        {/* Filter Pills */}
                        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                            {['yesterday', 'today', 'tomorrow', 'week', 'month'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setScheduleFilter(filter)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-all border ${scheduleFilter === filter ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'}`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        {/* Booking List */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {getFilteredBookings().length > 0 ? (
                                getFilteredBookings().map(booking => (
                                    <div key={booking.id} className="bg-[#1e1e2d] p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-1 h-12 rounded-full ${booking.status === 'CONFIRMED' ? 'bg-green-500' : booking.status === 'COMPLETED' ? 'bg-gray-500' : 'bg-blue-500'}`} />
                                            <div>
                                                <p className="text-white font-bold text-sm m-0">{booking.customerName}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-400 font-mono">
                                                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                                    </span>
                                                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400 uppercase font-black">
                                                        {booking.source || 'ONLINE'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Tag value={booking.status} severity={getStatusSeverity(booking.status)} className="mb-1" />
                                            <p className="text-[10px] text-gray-500 m-0 text-white font-mono">{booking.customerPhone || 'No Phone'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                                    <i className="pi pi-calendar-times text-4xl mb-2" />
                                    <p className="text-xs font-bold uppercase">No bookings found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Dialog>

            {/* Manual Booking Modal */}
            <Dialog
                header="New Walk-in Reservation"
                visible={isManualBookingOpen}
                onHide={() => setIsManualBookingOpen(false)}
                className="w-full md:w-[400px]"
                breakpoints={{ '960px': '75vw', '641px': '95vw' }}
                contentClassName="pb-6"
                dismissableMask
                draggable={false}
                resizable={false}
            >
                <div className="flex flex-col gap-4 mt-2 h-full overflow-y-auto" style={{ maxHeight: '60vh' }}>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Room</label>
                        <p className="font-bold text-white text-lg m-0">{selectedRoom?.name}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Guest Name (Optional)</label>
                        <InputText
                            value={manualBookingData.customerName}
                            onChange={(e) => setManualBookingData({ ...manualBookingData, customerName: e.target.value })}
                            className="w-full"
                            placeholder="Defaults to 'Walk-in Guest'"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone (Optional)</label>
                        <InputText
                            value={manualBookingData.phoneNumber}
                            onChange={(e) => setManualBookingData({ ...manualBookingData, phoneNumber: e.target.value })}
                            className="w-full"
                            placeholder="e.g. 9911..."
                            keyfilter="int"
                            inputMode="numeric"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Time</label>
                            <InputText
                                type="time"
                                value={manualBookingData.startTime}
                                onChange={(e) => setManualBookingData({ ...manualBookingData, startTime: e.target.value })}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration (Hrs)</label>
                            <InputNumber
                                value={manualBookingData.hours}
                                onValueChange={(e) => setManualBookingData({ ...manualBookingData, hours: e.value })}
                                showButtons
                                min={1}
                                max={12}
                                className="w-full"
                                inputId="duration-input"
                            />
                        </div>
                    </div>
                    <Divider />
                    <Button
                        label="Create Reservation"
                        icon="pi pi-check"
                        className="w-full p-button-success font-bold"
                        onClick={submitManualBooking}
                    />
                </div>
            </Dialog>

            {/* Profile Modal */}
            <ProfileModal
                visible={isProfileModalOpen}
                onHide={() => setIsProfileModalOpen(false)}
                currentUser={currentUser}
                onUpdate={updateStaff}
            />
        </div>
    );
};

export default StaffPortal;
