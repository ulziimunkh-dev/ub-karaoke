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

import AuditLogViewer from './staff/AuditLogViewer';

const StaffPortal = () => {
    const {
        venues, bookings, updateRoomStatus, updateBookingStatus,
        updateVenue, addOrder, currentUser, logout,
        activeVenueId, setActiveVenueId
    } = useData();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const toast = useRef(null);

    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('pos');
    const [activeBooking, setActiveBooking] = useState(null);

    // Filter venues for this organization
    const orgVenues = currentUser.role === 'sysadmin' ? venues : venues.filter(v => v.organizationId === currentUser.organizationId);
    const selectedVenue = venues.find(v => v.id === activeVenueId) || orgVenues[0];

    useEffect(() => {
        if (!activeVenueId && orgVenues.length > 0) {
            setActiveVenueId(orgVenues[0].id);
        }
    }, [activeVenueId, orgVenues]);

    const getActiveBooking = (venueId, roomName) => {
        return bookings.find(b =>
            b.venueId === venueId &&
            (b.room?.name === roomName || b.roomId === selectedRoom?.id) &&
            ['CONFIRMED', 'CHECKED_IN'].includes(b.status)
        );
    };

    const handleRoomClick = (room) => {
        const booking = getActiveBooking(selectedVenue.id, room.name);
        setSelectedRoom(room);
        setActiveBooking(booking);
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

    return (
        <div className="staff-portal">
            <Toast ref={toast} />

            <div className="flex justify-between items-center mb-6 bg-[#1e1e2d] p-4 rounded-xl border border-white/5">
                <div>
                    <h2 className="text-xl font-black text-white m-0 uppercase tracking-tighter">
                        Room Dashboard <span className="text-[#b000ff]">POS</span>
                    </h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
                        Viewing {selectedVenue?.name}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        icon={`pi pi-${selectedVenue?.isBookingEnabled ? 'lock' : 'unlock'}`}
                        label={selectedVenue?.isBookingEnabled ? 'Disable Online' : 'Enable Online'}
                        className={`p-button-sm ${selectedVenue?.isBookingEnabled ? 'p-button-outlined p-button-danger' : 'p-button-success'}`}
                        onClick={() => updateVenue(selectedVenue.id, { isBookingEnabled: !selectedVenue.isBookingEnabled })}
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

                        {getActiveBooking(selectedVenue.id, room.name) ? (
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Active Booking</span>
                                <span className="text-sm font-bold text-white truncate">
                                    {getActiveBooking(selectedVenue.id, room.name).customerName}
                                </span>
                                <span className="text-[10px] text-[#b000ff] font-black uppercase">
                                    {getActiveBooking(selectedVenue.id, room.name).startTime} (2h)
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
                                            <p className="text-sm font-bold text-white m-0">{activeBooking.startTime}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase m-0">Duration</p>
                                            <p className="text-sm font-bold text-white m-0">{activeBooking.duration} Hours</p>
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
                                    <Button label="Create Manual Walk-in" className="p-button-outlined p-button-sm mt-4" />
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
                                    <Button label="+ 1 Hour" icon="pi pi-clock" className="p-button-outlined p-button-info p-button-sm" />
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
            </Dialog>

            <style jsx>{`
                .staff-portal :global(.p-card) {
                    border-radius: 20px;
                }
                .heartbeat {
                    animation: heartbeat 2s infinite;
                }
                @keyframes heartbeat {
                    0% { opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
};

export default StaffPortal;
