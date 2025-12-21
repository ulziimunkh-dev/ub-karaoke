import React, { useState } from 'react';
import ReviewSection from './ReviewSection';
import { useLanguage } from '../contexts/LanguageContext';
import defaultRoom from '../assets/defaults/karaoke_minimal.png';

const BookingModal = ({ venue, onClose, onConfirmBooking, onAddReview }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1); // 1: Room Selection, 2: Details, 3: Payment, 4: Success
    const [selectedRooms, setSelectedRooms] = useState([]);

    // Default Date: Today
    const today = new Date().toISOString().split('T')[0];

    const [bookingData, setBookingData] = useState({
        date: today,
        time: '20:00',
        hours: 2,
        addOns: { birthday: false, decoration: false }
    });

    if (!venue) return null;

    const toggleRoomSelection = (room) => {
        setSelectedRooms(prev => {
            const isSelected = prev.find(r => r.id === room.id);
            if (isSelected) {
                return prev.filter(r => r.id !== room.id);
            } else {
                return [...prev, room];
            }
        });
    };

    const handleRoomConfirmation = () => {
        if (selectedRooms.length > 0) {
            setStep(2);
        }
    };

    const generateTimeSlots = (start, end) => {
        const slots = [];
        let [startHour] = start.split(':').map(Number);
        let [endHour] = end.split(':').map(Number);

        // Handle overnight (e.g., 14:00 to 04:00)
        let current = startHour;
        const closing = endHour < startHour ? endHour + 24 : endHour;

        while (current < closing) {
            const displayHour = current % 24;
            const hourStr = displayHour.toString().padStart(2, '0') + ":00";
            slots.push(hourStr);
            current++;
        }
        return slots;
    };

    const getMaxDuration = (startTime) => {
        if (!venue.openHours || !startTime) return 10;

        let [startHour] = startTime.split(':').map(Number);
        let [closeHour] = venue.openHours.end.split(':').map(Number);

        // Handle overnight
        if (closeHour < parseInt(venue.openHours.start.split(':')[0])) {
            closeHour += 24;
        }

        if (startHour < parseInt(venue.openHours.start.split(':')[0])) {
            startHour += 24;
        }

        const remaining = closeHour - startHour;
        return Math.max(1, remaining);
    };

    // Calculate max allowed duration based on currently selected time
    const maxAllowedDuration = bookingData.time ? getMaxDuration(bookingData.time) : 10;

    const handleDetailsSubmit = (e) => {
        e.preventDefault();
        setStep(3);
    };

    const handlePayment = () => {
        setTimeout(() => {
            onConfirmBooking(venue.id, { ...bookingData, rooms: selectedRooms });
            setStep(4);
        }, 1000);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}>&times;</button>

                <div className="modal-header">
                    <h2>{venue.name}</h2>
                    <p className="text-muted">{venue.district}</p>
                </div>

                <div className="modal-body">
                    {/* Step 1: Select Room */}
                    {step === 1 && (
                        <div className="room-selection-step">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3>{t('selectRoom')}</h3>
                                {selectedRooms.length > 0 && (
                                    <span style={{ color: '#E91E63', fontWeight: 'bold' }}>
                                        {selectedRooms.length} {t('roomsSelected')}
                                    </span>
                                )}
                            </div>
                            <div className="rooms-list">
                                {venue.isBookingEnabled === false && (
                                    <div style={{
                                        background: 'rgba(233, 30, 99, 0.1)',
                                        color: 'var(--color-accent)',
                                        padding: '15px',
                                        borderRadius: '10px',
                                        marginBottom: '20px',
                                        border: '1px solid var(--color-accent)',
                                        textAlign: 'center'
                                    }}>
                                        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{t('onlineBookingDisabled')}</p>
                                        <p style={{ fontSize: '0.9rem' }}>{t('bookingClosedMessage')}</p>
                                        <p style={{ marginTop: '10px', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                                            📞 {venue.phone || '77******'}
                                        </p>
                                    </div>
                                )}
                                {venue.rooms.map(room => {
                                    const isSelected = selectedRooms.find(r => r.id === room.id);
                                    return (
                                        <div
                                            key={room.id}
                                            className={`room-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => venue.isBookingEnabled !== false && toggleRoomSelection(room)}
                                            style={{
                                                border: isSelected ? '2px solid #E91E63' : '2px solid transparent',
                                                background: isSelected ? 'rgba(233, 30, 99, 0.1)' : '',
                                                opacity: venue.isBookingEnabled === false ? 0.7 : 1,
                                                cursor: venue.isBookingEnabled === false ? 'default' : 'pointer'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                {venue.isBookingEnabled !== false && (
                                                    <input
                                                        type="checkbox"
                                                        checked={!!isSelected}
                                                        readOnly
                                                        style={{ marginRight: '15px', transform: 'scale(1.2)' }}
                                                    />
                                                )}
                                                <img
                                                    src={(room.images && room.images.length > 0) ? room.images[0] : defaultRoom}
                                                    alt={room.name}
                                                    className="room-image-thumb"
                                                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginRight: '15px' }}
                                                />
                                                <div className="room-info">
                                                    <h4>{room.name} <span className="badge">{room.type}</span></h4>
                                                    <p className="text-muted">
                                                        {room.capacity} {t('capacity')} • {(room.hourlyRate || room.pricePerHour || 0).toLocaleString()}₮
                                                    </p>
                                                    <div className="room-features">
                                                        {room.features.slice(0, 3).map(f => (
                                                            <span key={f} className="feature-tag">{f}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            {venue.isBookingEnabled !== false && (
                                                <div className="selection-indicator">
                                                    {isSelected ? 'Selected' : 'Select'}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="modal-actions" style={{ marginTop: '20px' }}>
                                <button className="btn btn-outline" onClick={onClose}>{t('cancel')}</button>
                                {venue.isBookingEnabled !== false && (
                                    <button
                                        className="btn btn-primary"
                                        disabled={selectedRooms.length === 0}
                                        onClick={handleRoomConfirmation}
                                    >
                                        {t('confirmSelection')} ({selectedRooms.length})
                                    </button>
                                )}
                            </div>

                            <hr className="divider" />
                            <ReviewSection reviews={venue.reviews} onAddReview={(review) => onAddReview(venue.id, review)} />
                        </div>
                    )}

                    {/* Step 2: Details & Booking */}
                    {step === 2 && (
                        <div className="booking-step">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3>{t('bookingDetails')}</h3>
                                <span className="text-muted">{selectedRooms.length} {t('roomsSelected')}</span>
                            </div>

                            {/* Selected Rooms Summary */}
                            <div className="selected-rooms-summary" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
                                {selectedRooms.map(room => (
                                    <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span>{room.name} ({room.type})</span>
                                        <span>{(room.hourlyRate || room.pricePerHour || 0).toLocaleString()}₮</span>
                                    </div>
                                ))}
                            </div>

                            {/* Event Add-ons */}
                            {selectedRooms.some(r => r.partySupport?.birthday || r.partySupport?.decoration) && (
                                <div className="add-ons-section" style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <h4 style={{ marginBottom: '10px' }}>{t('addOns')}</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {selectedRooms.some(r => r.partySupport?.birthday) && (
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={bookingData.addOns.birthday}
                                                    onChange={e => setBookingData({ ...bookingData, addOns: { ...bookingData.addOns, birthday: e.target.checked } })}
                                                />
                                                {t('birthdaySetup')} (+50,000₮)
                                            </label>
                                        )}
                                        {selectedRooms.some(r => r.partySupport?.decoration) && (
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={bookingData.addOns.decoration}
                                                    onChange={e => setBookingData({ ...bookingData, addOns: { ...bookingData.addOns, decoration: e.target.checked } })}
                                                />
                                                {t('partyDecoration')} (+30,000₮)
                                            </label>
                                        )}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleDetailsSubmit} className="booking-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <input
                                            id="booking-date"
                                            type="date"
                                            required
                                            placeholder=" "
                                            value={bookingData.date}
                                            onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                                        />
                                        <label htmlFor="booking-date">{t('date')}</label>
                                    </div>
                                    <div className="form-group">
                                        <select
                                            id="booking-time"
                                            required
                                            value={bookingData.time}
                                            onChange={e => {
                                                const newTime = e.target.value;
                                                const max = getMaxDuration(newTime);
                                                setBookingData({
                                                    ...bookingData,
                                                    time: newTime,
                                                    hours: Math.min(bookingData.hours, max)
                                                });
                                            }}
                                            className="time-select"
                                        >
                                            <option value="">{t('selectStartTime')}</option>
                                            {venue.openHours ? generateTimeSlots(venue.openHours.start, venue.openHours.end).map(time => (
                                                <option key={time} value={time}>{time}</option>
                                            )) : (
                                                <option value="18:00">18:00</option>
                                            )}
                                        </select>
                                        <label htmlFor="booking-time">{t('time')}</label>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <input
                                        id="booking-duration"
                                        type="number"
                                        min="1" max={maxAllowedDuration}
                                        placeholder=" "
                                        value={bookingData.hours}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            setBookingData({ ...bookingData, hours: Math.min(val, maxAllowedDuration) });
                                        }}
                                    />
                                    <label htmlFor="booking-duration">{t('duration')}</label>
                                </div>
                                <div className="total-price">
                                    {t('total')}: {(
                                        (selectedRooms.reduce((sum, r) => sum + (Number(r.hourlyRate) || Number(r.pricePerHour) || 0), 0) * Number(bookingData.hours)) +
                                        (bookingData.addOns.birthday ? 50000 : 0) +
                                        (bookingData.addOns.decoration ? 30000 : 0)
                                    ).toLocaleString()}₮
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>{t('back')}</button>
                                    <button type="submit" className="btn btn-primary">{t('proceedPayment')}</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Step 3: Payment */}
                    {step === 3 && (
                        <div className="payment-step">
                            <h3>{t('confirmPayment')}</h3>
                            <div className="bank-details">
                                <p>{t('transferInstruction')} <strong>{(
                                    (selectedRooms.reduce((sum, r) => sum + (Number(r.hourlyRate) || Number(r.pricePerHour) || 0), 0) * Number(bookingData.hours)) +
                                    (bookingData.addOns.birthday ? 50000 : 0) +
                                    (bookingData.addOns.decoration ? 30000 : 0)
                                ).toLocaleString()}₮</strong>:</p>
                                <div className="account-box">
                                    <p>{t('bankName')}</p>
                                    <p>{t('accountNumber')}</p>
                                    <p>{t('accountName')}</p>
                                </div>
                                <p className="small-text">{t('clickConfirm')}</p>
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-outline" onClick={() => setStep(2)}>{t('back')}</button>
                                <button className="btn btn-primary" onClick={handlePayment}>{t('confirmTransfer')}</button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <div className="success-step">
                            <div className="success-icon">🎉</div>
                            <h3>{t('bookingConfirmed')}</h3>
                            <p>{t('reservedMessage', { venue: venue.name })}</p>
                            <button className="btn btn-primary" onClick={onClose}>{t('done')}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
