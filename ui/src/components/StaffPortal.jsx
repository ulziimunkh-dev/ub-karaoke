import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';

const StaffPortal = () => {
    const { venues, bookings, updateRoomStatus, updateBookingStatus, updateVenue, addOrder, currentUser, logout } = useData();
    const [selectedVenueId, setSelectedVenueId] = useState(venues[0]?.id);
    const [selectedRoom, setSelectedRoom] = useState(null); // { venueId, room }
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    // Action Modal State
    const [activeBooking, setActiveBooking] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [timeExtension, setTimeExtension] = useState(0);

    const selectedVenue = venues.find(v => v.id === selectedVenueId);

    // Helper: Find active booking for a room
    const getActiveBooking = (venueId, roomName) => {
        // In real app, check date/time overlapping. Here just check 'Confirmed' or 'CheckedIn' status for simplicity
        return bookings.find(b =>
            b.venueId === venueId &&
            b.roomName === roomName &&
            ['Confirmed', 'CheckedIn'].includes(b.status)
        );
    };

    const handleRoomClick = (room) => {
        const booking = getActiveBooking(selectedVenue.id, room.name);
        setSelectedRoom({ venueId: selectedVenue.id, ...room });
        setActiveBooking(booking);
        setIsActionModalOpen(true);
        setOrderItems([]); // Reset order form
    };

    const handleCheckIn = () => {
        if (activeBooking) {
            updateBookingStatus(activeBooking.id, 'CheckedIn');
            updateRoomStatus(selectedVenue.id, selectedRoom.id, 'Occupied');
            setIsActionModalOpen(false);
        } else {
            // Walk-in logic (simplified: create booking now)
            alert('Walk-in logic here: Create Booking Modal');
        }
    };

    const handleCheckOut = () => {
        if (activeBooking) {
            updateBookingStatus(activeBooking.id, 'Completed'); // or 'Paid' flow
            updateRoomStatus(selectedVenue.id, selectedRoom.id, 'Cleaning');
            setIsActionModalOpen(false);
        }
    };

    const handleAddOrder = () => {
        // Mock Item addition
        const item = { name: 'Beer', price: 6000, qty: 1 };
        addOrder(activeBooking.id, [item]);
        alert('Order Added');
    };

    const handleFinishCleaning = (room) => {
        updateRoomStatus(selectedVenue.id, room.id, 'Available');
    };

    return (
        <div style={{ padding: '20px', background: '#121212', minHeight: '100vh', color: 'white' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Staff Point of Sale</h1>
                    <p style={{ color: '#888' }}>{currentUser.name} • {selectedVenue?.name}</p>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <select
                        value={selectedVenueId}
                        onChange={e => setSelectedVenueId(Number(e.target.value))}
                        style={{ padding: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }}
                    >
                        {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                    <button
                        onClick={() => updateVenue(selectedVenueId, { isBookingEnabled: !selectedVenue.isBookingEnabled })}
                        className={`btn ${selectedVenue?.isBookingEnabled === false ? 'btn-primary' : 'btn-outline'}`}
                    >
                        {selectedVenue?.isBookingEnabled === false ? 'Enable Online Booking' : 'Disable Online Booking'}
                    </button>
                    <button onClick={logout} className="btn btn-outline">Logout</button>
                </div>
            </div>

            {/* Room Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {selectedVenue?.rooms.map(room => {
                    const booking = getActiveBooking(selectedVenue.id, room.name);
                    const statusColor =
                        room.status === 'Occupied' ? '#E91E63' :
                            room.status === 'Cleaning' ? '#FFC107' :
                                room.status === 'Maintenance' ? '#9E9E9E' : '#4CAF50';

                    return (
                        <div
                            key={room.id}
                            onClick={() => room.status === 'Cleaning' ? handleFinishCleaning(room) : handleRoomClick(room)}
                            style={{
                                background: '#222', borderRadius: '15px', padding: '20px', cursor: 'pointer',
                                borderTop: `6px solid ${statusColor}`, minHeight: '150px', position: 'relative'
                            }}
                        >
                            <h3 style={{ marginTop: 0 }}>{room.name}</h3>
                            <span style={{
                                position: 'absolute', top: '20px', right: '20px',
                                background: statusColor, padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'
                            }}>
                                {room.status}
                            </span>

                            {booking && (
                                <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#ccc' }}>
                                    <p>Guest: <strong>{booking.user}</strong></p>
                                    <p>Time: {booking.time} ({booking.duration}h)</p>
                                </div>
                            )}

                            {room.status === 'Cleaning' && (
                                <div style={{ marginTop: '30px', textAlign: 'center', color: '#FFC107', fontWeight: 'bold' }}>
                                    Tap to Finish Cleaning
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Room Action Modal */}
            {isActionModalOpen && selectedRoom && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ background: '#1e1e1e', width: '800px', borderRadius: '15px', display: 'flex', overflow: 'hidden', height: '80vh' }}>
                        {/* Left: Info */}
                        <div style={{ flex: 1, padding: '30px', borderRight: '1px solid #333' }}>
                            <h2 style={{ marginBottom: '10px' }}>{selectedRoom.name}</h2>
                            <p style={{ color: '#aaa', marginBottom: '20px' }}>{selectedRoom.status}</p>

                            {activeBooking ? (
                                <div>
                                    <div style={{ background: '#333', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
                                        <h3>Current Session</h3>
                                        <p>Guest: {activeBooking.user}</p>
                                        <p>Time: {activeBooking.time} - {activeBooking.duration}h</p>
                                        <h2 style={{ color: '#4CAF50', marginTop: '10px' }}>Total: {activeBooking.total.toLocaleString()}₮</h2>
                                    </div>

                                    {activeBooking.status === 'Confirmed' ? (
                                        <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '1.2rem' }} onClick={handleCheckIn}>
                                            START SESSION (Check-in)
                                        </button>
                                    ) : (
                                        <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '1.2rem', background: '#E91E63' }} onClick={handleCheckOut}>
                                            END SESSION (Check-out)
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <h3>Room is Available</h3>
                                    <button className="btn btn-primary" style={{ marginTop: '20px' }}>Walk-in Booking</button>
                                </div>
                            )}
                        </div>

                        {/* Right: POS & Services */}
                        <div style={{ flex: 1, padding: '30px', background: '#252525' }}>
                            <h3>Services & Orders</h3>
                            {activeBooking && activeBooking.status === 'CheckedIn' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
                                    <button className="btn btn-outline" style={{ height: '80px' }} onClick={handleAddOrder}>
                                        🍺 Drinks
                                    </button>
                                    <button className="btn btn-outline" style={{ height: '80px' }}>
                                        🍝 Food
                                    </button>
                                    <button className="btn btn-outline" style={{ height: '80px' }}>
                                        🕑 Extend Time
                                    </button>
                                    <button className="btn btn-outline" style={{ height: '80px' }}>
                                        🎤 Extra Mic
                                    </button>
                                </div>
                            ) : (
                                <p style={{ color: '#666', marginTop: '20px' }}>Services available only during active session.</p>
                            )}

                            <div style={{ marginTop: 'auto', paddingTop: '30px' }}>
                                <button className="btn btn-text" style={{ width: '100%' }} onClick={() => setIsActionModalOpen(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffPortal;
