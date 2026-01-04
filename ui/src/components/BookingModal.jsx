import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import LoginModal from './LoginModal';
import ReviewSection from './ReviewSection';
import { useLanguage } from '../contexts/LanguageContext';
import defaultRoom from '../assets/defaults/karaoke_minimal.png';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';

const BookingModal = ({ venue, onClose, onConfirmBooking, onAddReview }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1); // 1: Room Selection, 2: Details, 3: Payment, 4: Success
    const [selectedRooms, setSelectedRooms] = useState([]);
    const { currentUser } = useData();
    const [showLogin, setShowLogin] = useState(false);

    // Default Date: Today
    const [bookingDate, setBookingDate] = useState(new Date());

    // Calculate max advance booking date
    const maxDate = new Date();
    maxDate.setDate(new Date().getDate() + (venue.advanceBookingDays || 3));

    const [bookingData, setBookingData] = useState({
        time: '',
        hours: 2,
        addOns: { birthday: false, decoration: false }
    });

    if (!venue) return null;

    const generateTimeSlots = (start, end) => {
        const slots = [];
        let [startHour] = start.toString().split(':').map(Number);
        let [endHour] = end.toString().split(':').map(Number);
        let current = startHour;
        const closing = endHour <= startHour ? endHour + 24 : endHour;

        while (current < closing) {
            const displayHour = current % 24;
            const hourStr = displayHour.toString().padStart(2, '0') + ":00";
            slots.push({ label: hourStr, value: hourStr });
            current++;
        }
        return slots;
    };

    const getBookingTimeSlots = () => {
        if (venue.bookingWindowStart && venue.bookingWindowEnd) {
            return generateTimeSlots(venue.bookingWindowStart, venue.bookingWindowEnd);
        }
        if (venue.openingHours && typeof venue.openingHours === 'object') {
            const dailyHours = venue.openingHours['Monday'] || "10:00-02:00";
            const [start, end] = dailyHours.split('-');
            if (start && end) return generateTimeSlots(start, end);
        }
        return generateTimeSlots('10:00', '02:00');
    };

    useEffect(() => {
        const slots = getBookingTimeSlots();
        if (slots.length > 0 && !bookingData.time) {
            setBookingData(prev => ({ ...prev, time: slots[0].value }));
        }
    }, [venue]);


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

    // Calculate max allowed duration based on currently selected time
    const maxAllowedDuration = 6;

    const handleDetailsSubmit = (e) => {
        e.preventDefault();
        setStep(3);
    };

    const handlePayment = () => {
        if (!currentUser) {
            setShowLogin(true);
            return;
        }

        if (currentUser.role === 'staff' || currentUser.role === 'manager' || currentUser.role === 'sysadmin') {
            alert(t('staffBookingRestriction') || "Staff must use Admin Panel for manual bookings.");
            return;
        }

        setTimeout(() => {
            onConfirmBooking(venue.id, {
                ...bookingData,
                date: bookingDate.toISOString().split('T')[0],
                rooms: selectedRooms
            });
            setStep(4);
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex justify-center items-center z-[60] p-4 animate-[fadeIn_0.2s_ease]">
            <div className="bg-[#1a1a24] w-full max-w-[800px] rounded-2xl relative max-h-[90vh] overflow-y-auto border border-white/10 shadow-modal">
                <button className="absolute top-4 right-5 text-3xl bg-transparent text-text-muted leading-none z-[101] hover:text-white transition-colors" onClick={onClose}>&times;</button>

                <div className="pt-8 px-8 pb-0">
                    <h2 className="text-2xl font-bold mb-1">{venue.name}</h2>
                    <p className="text-text-muted">{venue.district}</p>
                </div>

                <div className="p-8">
                    {/* Step 1: Select Room */}
                    {step === 1 && (
                        <div className="room-selection-step">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                                <h3 className="text-xl font-bold m-0">{t('selectRoom')}</h3>
                                {selectedRooms.length > 0 && (
                                    <div className="px-4 py-2 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] rounded-full">
                                        <span className="font-bold text-white text-sm">
                                            {selectedRooms.length} {t('roomsSelected')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {venue.isBookingEnabled === false && (
                                    <div className="col-span-1 md:col-span-2">
                                        <div className="bg-surface p-6 rounded-xl border border-primary text-center">
                                            <p className="font-bold text-xl text-primary mb-2">{t('onlineBookingDisabled')}</p>
                                            <p className="text-text-muted mb-4">{t('bookingClosedMessage')}</p>
                                            <h3 className="m-0 font-bold text-xl">📞 {venue.phone || '77******'}</h3>
                                        </div>
                                    </div>
                                )}
                                {venue.rooms.map(room => {
                                    const isSelected = selectedRooms.find(r => r.id === room.id);
                                    return (
                                        <div key={room.id}
                                            className={`bg-white/5 p-4 rounded-xl cursor-pointer transition-all duration-200 border ${isSelected ? 'border-[#b000ff] bg-[#b000ff]/5 shadow-[0_0_15px_rgba(176,0,255,0.3)]' : 'border-white/5 hover:bg-white/10 hover:border-white/10'}`}
                                            onClick={() => venue.isBookingEnabled !== false && toggleRoomSelection(room)}
                                            style={{ opacity: venue.isBookingEnabled === false ? 0.7 : 1 }}
                                        >
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                                <img
                                                    src={(room.images && room.images.length > 0) ? room.images[0] : defaultRoom}
                                                    alt={room.name}
                                                    className="rounded-lg w-full sm:w-20 h-32 sm:h-20 object-cover"
                                                />
                                                <div className="flex-1 w-full">
                                                    <div className="flex justify-between items-start mb-1 gap-2">
                                                        <h4 className="m-0 font-bold text-base sm:text-lg">{room.name}</h4>
                                                        <Tag value={room.type} severity="info" className="text-xs flex-shrink-0" />
                                                    </div>
                                                    <p className="text-text-muted text-sm mb-2">
                                                        {room.capacity} {t('capacity')} • {(room.hourlyRate || room.pricePerHour || 0).toLocaleString()}₮
                                                    </p>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {room.features?.slice(0, 2).map(f => (
                                                            <span key={f} className="text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 rounded">{f}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                {venue.isBookingEnabled !== false && (
                                                    <Checkbox checked={!!isSelected} className="ml-0 sm:ml-2 self-center" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={onClose}
                                    className="h-11 px-6 border border-[#b000ff] text-[#b000ff] bg-transparent rounded-lg hover:bg-[#b000ff]/10 hover:text-[#eb79b2] transition-all font-bold"
                                >
                                    {t('cancel')}
                                </button>
                                {venue.isBookingEnabled !== false && (
                                    <button
                                        disabled={selectedRooms.length === 0}
                                        onClick={handleRoomConfirmation}
                                        className="h-11 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {`${t('confirmSelection')} (${selectedRooms.length})`}
                                    </button>
                                )}
                            </div>

                            <div className="border-t border-white/10 my-8"></div>
                            <ReviewSection reviews={venue.reviews} onAddReview={(review) => onAddReview(venue.id, review)} />
                        </div>
                    )}

                    {/* Step 2: Details & Booking */}
                    {step === 2 && (
                        <div className="booking-step">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold m-0">{t('bookingDetails')}</h3>
                                <Tag value={`${selectedRooms.length} ${t('roomsSelected')} `} severity="info" />
                            </div>

                            <div className="bg-white/5 p-4 rounded-xl mb-6 border border-white/10">
                                {selectedRooms.map(room => (
                                    <div key={room.id} className="flex justify-between mb-2 last:mb-0 text-sm">
                                        <span className="text-gray-300">{room.name} ({room.type})</span>
                                        <span className="font-bold">{(room.hourlyRate || room.pricePerHour || 0).toLocaleString()}₮</span>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleDetailsSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="font-bold text-sm text-text-muted">{t('date')}</label>
                                        <Calendar value={bookingDate} onChange={(e) => setBookingDate(e.value)} minDate={new Date()} maxDate={maxDate} showIcon className="w-full" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="font-bold text-sm text-text-muted">{t('time')}</label>
                                        <Dropdown value={bookingData.time} options={getBookingTimeSlots()} onChange={(e) => setBookingData({ ...bookingData, time: e.value })} placeholder={t('selectStartTime')} className="w-full" />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                                        <label className="font-bold text-sm text-text-muted">{t('duration')} (Hours)</label>
                                        <InputNumber value={bookingData.hours} onValueChange={(e) => setBookingData({ ...bookingData, hours: e.value })} min={1} max={maxAllowedDuration} showButtons className="w-full" />
                                    </div>
                                </div>

                                {selectedRooms.some(r => r.partySupport?.birthday || r.partySupport?.decoration) && (
                                    <div className="bg-white/5 p-4 rounded-xl mb-6 border border-white/10">
                                        <h4 className="m-0 mb-3 font-bold">{t('addOns')}</h4>
                                        <div className="flex flex-col gap-3">
                                            {selectedRooms.some(r => r.partySupport?.birthday) && (
                                                <div className="flex items-center">
                                                    <Checkbox inputId="birthday" checked={bookingData.addOns.birthday} onChange={e => setBookingData({ ...bookingData.addOns, birthday: e.checked })} />
                                                    <label htmlFor="birthday" className="ml-3 cursor-pointer text-sm">{t('birthdaySetup')} (+50,000₮)</label>
                                                </div>
                                            )}
                                            {selectedRooms.some(r => r.partySupport?.decoration) && (
                                                <div className="flex items-center">
                                                    <Checkbox inputId="decoration" checked={bookingData.addOns.decoration} onChange={e => setBookingData({ ...bookingData.addOns, decoration: e.checked })} />
                                                    <label htmlFor="decoration" className="ml-3 cursor-pointer text-sm">{t('partyDecoration')} (+30,000₮)</label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mb-6 p-4 bg-surface rounded-xl border border-white/5">
                                    <span className="text-xl font-semibold">{t('total')}:</span>
                                    <span className="text-2xl font-bold text-primary drop-shadow-[0_0_10px_rgba(176,0,255,0.4)]">
                                        {(
                                            (selectedRooms.reduce((sum, r) => sum + (Number(r.hourlyRate) || Number(r.pricePerHour) || 0), 0) * Number(bookingData.hours)) +
                                            (bookingData.addOns.birthday ? 50000 : 0) +
                                            (bookingData.addOns.decoration ? 30000 : 0)
                                        ).toLocaleString()}₮
                                    </span>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="h-11 px-6 border border-[#b000ff] text-[#b000ff] bg-transparent rounded-lg hover:bg-[#b000ff]/10 hover:text-[#eb79b2] transition-all font-bold"
                                    >
                                        {t('back')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="h-11 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300"
                                    >
                                        {t('proceedPayment')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Step 3: Payment */}
                    {step === 3 && (
                        <div className="text-center py-4">
                            <h3 className="text-xl font-bold mb-6">{t('confirmPayment')}</h3>
                            <div className="bg-white/5 p-6 rounded-xl border border-white/10 mb-6">
                                <p className="mb-3 text-gray-300">{t('transferInstruction')}</p>
                                <h2 className="m-0 text-3xl font-bold text-primary mb-6 drop-shadow-[0_0_10px_rgba(176,0,255,0.4)]">
                                    {(
                                        (selectedRooms.reduce((sum, r) => sum + (Number(r.hourlyRate) || Number(r.pricePerHour) || 0), 0) * Number(bookingData.hours)) +
                                        (bookingData.addOns.birthday ? 50000 : 0) +
                                        (bookingData.addOns.decoration ? 30000 : 0)
                                    ).toLocaleString()}₮
                                </h2>
                                <div className="p-4 bg-black/30 rounded-lg text-left inline-block border border-white/5 w-full max-w-sm">
                                    <p className="my-1.5"><span className="text-text-muted mr-2">{t('bankName')}:</span> <span className="font-bold text-white">KHAN BANK</span></p>
                                    <p className="my-1.5"><span className="text-text-muted mr-2">{t('accountNumber')}:</span> <span className="font-bold text-secondary">5070******</span></p>
                                    <p className="my-1.5"><span className="text-text-muted mr-2">{t('accountName')}:</span> <span className="font-bold text-white">UB KARAOKE LLC</span></p>
                                </div>
                                <p className="mt-4 text-xs text-text-muted">{t('clickConfirm')}</p>
                            </div>
                            <div className="flex justify-center gap-3 mt-6">
                                <button
                                    onClick={() => setStep(2)}
                                    className="h-11 px-6 border border-[#b000ff] text-[#b000ff] bg-transparent rounded-lg hover:bg-[#b000ff]/10 hover:text-[#eb79b2] transition-all font-bold"
                                >
                                    {t('back')}
                                </button>
                                <button
                                    onClick={handlePayment}
                                    className="h-11 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300 flex items-center gap-2"
                                >
                                    <i className="pi pi-check"></i>
                                    {t('confirmTransfer')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <div className="text-center py-12">
                            <i className="pi pi-check-circle text-6xl text-green-400 mb-6 block animate-bounce"></i>
                            <h2 className="text-2xl font-bold mb-2">{t('bookingConfirmed')}</h2>
                            <p className="text-text-muted mb-8">{t('reservedMessage', { venue: venue.name })}</p>
                            <button
                                onClick={onClose}
                                className="w-48 h-12 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                {t('done')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        </div>
    );
};

export default BookingModal;
