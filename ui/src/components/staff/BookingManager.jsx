import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';

const BookingManager = () => {
    const { bookings, venues, approveBooking, rejectBooking, createManualBooking } = useData();
    const { t } = useLanguage();
    const [showModal, setShowModal] = useState(false);

    // Manual Booking Form State
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        venueId: venues[0]?.id || '',
        roomId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '18:00',
        duration: 2,
        paymentMethod: 'CASH',
        amountPaid: 0
    });

    const handleApprove = async (id) => {
        if (window.confirm(t('approveBookingConfirm'))) {
            await approveBooking(id);
        }
    };

    const handleReject = async (id) => {
        if (window.confirm(t('rejectBookingConfirm'))) {
            await rejectBooking(id);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Calculate end time
            const [hours, minutes] = formData.startTime.split(':');
            const endHour = parseInt(hours) + parseInt(formData.duration);
            const endTime = `${String(endHour).padStart(2, '0')}:${minutes}`;

            // Get room price
            const venue = venues.find(v => v.id === Number(formData.venueId));
            const room = venue?.rooms.find(r => r.id === Number(formData.roomId));

            if (!room) {
                alert(t('invalidRoomSelection'));
                return;
            }

            const totalPrice = room.pricePerHour * formData.duration;

            await createManualBooking({
                ...formData,
                venueId: Number(formData.venueId),
                roomId: Number(formData.roomId),
                endTime,
                totalPrice
            });
            setShowModal(false);
            alert(t('bookingCreatedSuccess'));
        } catch (error) {
            alert(t('bookingCreateFailed'));
        }
    };

    const selectedVenue = venues.find(v => v.id === Number(formData.venueId));

    return (
        <div style={{ padding: '20px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>{t('bookingsManagement')}</h2>
                <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                    + {t('manualReservation')}
                </button>
            </div>

            {/* Booking List */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #444' }}>
                            <th style={{ padding: '10px' }}>{t('id')}</th>
                            <th style={{ padding: '10px' }}>{t('customer')}</th>
                            <th style={{ padding: '10px' }}>{t('roomSingular')}</th>
                            <th style={{ padding: '10px' }}>{t('date')}/{t('time')}</th>
                            <th style={{ padding: '10px' }}>{t('status')}</th>
                            <th style={{ padding: '10px' }}>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map(booking => (
                            <tr key={booking.id} style={{ borderBottom: '1px solid #222', background: booking.status === 'PENDING' ? '#2a1a1a' : 'transparent' }}>
                                <td style={{ padding: '10px' }}>#{booking.id}</td>
                                <td style={{ padding: '10px' }}>
                                    {booking.customerName}<br />
                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{booking.customerPhone}</span>
                                </td>
                                <td style={{ padding: '10px' }}>
                                    {booking.venue?.name} - {booking.room?.name}
                                </td>
                                <td style={{ padding: '10px' }}>
                                    {new Date(booking.date).toLocaleDateString()} <br />
                                    {booking.startTime} - {booking.endTime}
                                </td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                        background:
                                            booking.status === 'CONFIRMED' ? '#4CAF50' :
                                                booking.status === 'PENDING' ? '#FFC107' :
                                                    booking.status === 'REJECTED' ? '#F44336' : '#9E9E9E',
                                        color: booking.status === 'PENDING' ? 'black' : 'white'
                                    }}>
                                        {t(booking.status.toLowerCase())}
                                    </span>
                                </td>
                                <td style={{ padding: '10px' }}>
                                    {booking.status === 'PENDING' && (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleApprove(booking.id)} className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>{t('approve')}</button>
                                            <button onClick={() => handleReject(booking.id)} className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '0.8rem', color: '#F44336', borderColor: '#F44336' }}>{t('reject')}</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Manual Booking Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '10px', width: '500px', maxWidth: '90%' }}>
                        <h3>{t('newManualBooking')}</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input
                                placeholder={t('fullName')}
                                value={formData.customerName}
                                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                                required
                                style={{ padding: '10px', background: '#333', border: '1px solid #444', color: 'white' }}
                            />
                            <input
                                placeholder={t('phoneNumber')}
                                value={formData.customerPhone}
                                onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                                required
                                style={{ padding: '10px', background: '#333', border: '1px solid #444', color: 'white' }}
                            />

                            <select
                                value={formData.venueId}
                                onChange={e => setFormData({ ...formData, venueId: e.target.value, roomId: '' })}
                                style={{ padding: '10px', background: '#333', border: '1px solid #444', color: 'white' }}
                            >
                                <option value="">{t('selectVenue')}</option>
                                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>

                            <select
                                value={formData.roomId}
                                onChange={e => setFormData({ ...formData, roomId: e.target.value })}
                                required
                                style={{ padding: '10px', background: '#333', border: '1px solid #444', color: 'white' }}
                                disabled={!formData.venueId}
                            >
                                <option value="">{t('selectRoom')}</option>
                                {selectedVenue?.rooms.map(r => <option key={r.id} value={r.id}>{r.name} - {r.pricePerHour}/hr</option>)}
                            </select>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    required
                                    style={{ flex: 1, padding: '10px', background: '#333', border: '1px solid #444', color: 'white' }}
                                />
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    required
                                    style={{ flex: 1, padding: '10px', background: '#333', border: '1px solid #444', color: 'white' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <label>{t('durationHours')}:</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                                    style={{ width: '60px', padding: '10px', background: '#333', border: '1px solid #444', color: 'white' }}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary">{t('createAndConfirm')}</button>
                            <button type="button" onClick={() => setShowModal(false)} className="btn btn-text">{t('cancel')}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingManager;
