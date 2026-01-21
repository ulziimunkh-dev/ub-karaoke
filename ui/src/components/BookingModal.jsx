import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import LoginModal from './LoginModal';
import ReviewSection from './ReviewSection';
import { useLanguage } from '../contexts/LanguageContext';
import { formatTimeRange, getCurrentDayName, getOpeningHoursMap } from '../utils/time';
import defaultRoom from '../assets/defaults/karaoke_minimal.png';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Galleria } from 'primereact/galleria';
import { Divider } from 'primereact/divider';
import { api } from '../utils/api';

const BookingModal = ({ venue, onClose, onConfirmBooking, onAddReview }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1); // 1: Room Selection, 2: Details, 3: Payment, 4: Success
    const [selectedRooms, setSelectedRooms] = useState([]);
    const { currentUser } = useData();
    const [showLogin, setShowLogin] = useState(false);
    const [previewRoom, setPreviewRoom] = useState(null);

    // Default Date: Today
    const [bookingDate, setBookingDate] = useState(new Date());

    // Calculate max advance booking date
    const maxDate = new Date();
    maxDate.setDate(new Date().getDate() + (venue.advanceBookingDays || 3));

    const [bookingData, setBookingData] = useState({
        time: '',
        hours: Number(venue.minBookingHours) || 2,
        addOns: { birthday: false, decoration: false }
    });

    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

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
        const fetchAvailability = async () => {
            if (!bookingDate || selectedRooms.length === 0) {
                setAvailableSlots([]);
                return;
            }
            setLoadingSlots(true);
            try {
                // Adjust for local date string to avoid timezone offset issues
                const year = bookingDate.getFullYear();
                const month = (bookingDate.getMonth() + 1).toString().padStart(2, '0');
                const day = bookingDate.getDate().toString().padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                const slotsPerRoom = await Promise.all(
                    selectedRooms.map(room => api.getBookingsAvailability(room.id, dateStr))
                );

                if (slotsPerRoom.length > 0) {
                    // Intersect times and take MIN of maxHours
                    const allTimes = slotsPerRoom[0].map(s => s.time);
                    const intersection = allTimes.filter(t =>
                        slotsPerRoom.every(roomSlots => roomSlots.some(rs => rs.time === t))
                    );

                    const formattedSlots = intersection.map(t => {
                        const minMaxHours = Math.min(...slotsPerRoom.map(roomSlots =>
                            roomSlots.find(rs => rs.time === t).maxHours
                        ));
                        return { label: t, value: t, maxHours: minMaxHours };
                    });

                    setAvailableSlots(formattedSlots);

                    if (formattedSlots.length > 0 && (!bookingData.time || !formattedSlots.find(s => s.value === bookingData.time))) {
                        setBookingData(prev => ({ ...prev, time: formattedSlots[0].value }));
                    }
                } else {
                    setAvailableSlots([]);
                }
            } catch (error) {
                console.error('Failed to fetch availability:', error);
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchAvailability();
    }, [bookingDate, selectedRooms, venue]);


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
    const selectedSlot = availableSlots.find(s => s.value === bookingData.time);
    const maxVenueHours = Number(venue.maxBookingHours || 6);
    const minVenueHours = Number(venue.minBookingHours || 1);
    const isFixedDuration = minVenueHours === maxVenueHours;

    const maxAllowedDuration = selectedSlot ? Math.min(selectedSlot.maxHours, maxVenueHours) : maxVenueHours;

    useEffect(() => {
        if (isFixedDuration && bookingData.hours !== minVenueHours) {
            setBookingData(prev => ({ ...prev, hours: minVenueHours }));
        } else if (bookingData.hours > maxAllowedDuration) {
            setBookingData(prev => ({ ...prev, hours: Math.max(minVenueHours, Math.floor(maxAllowedDuration)) }));
        }
    }, [bookingData.time, availableSlots, isFixedDuration, maxAllowedDuration]);

    const handleDetailsSubmit = (e) => {
        e.preventDefault();
        setStep(3);
    };

    const [isBooking, setIsBooking] = useState(false);
    const [bookingError, setBookingError] = useState(null);

    const handlePayment = async () => {
        if (!currentUser) {
            setShowLogin(true);
            return;
        }

        if (currentUser.role === 'staff' || currentUser.role === 'manager' || currentUser.role === 'sysadmin') {
            alert(t('staffBookingRestriction') || "Staff must use Admin Panel for manual bookings.");
            return;
        }

        setIsBooking(true);
        setBookingError(null);
        try {
            await onConfirmBooking(venue.id, {
                ...bookingData,
                date: bookingDate.toISOString().split('T')[0],
                rooms: selectedRooms
            });
            setStep(4);
        } catch (error) {
            console.error('Booking failed:', error);
            setBookingError(error.response?.data?.message || error.message || t('bookingFailed'));
        } finally {
            setIsBooking(false);
        }
    };

    // Dynamic Price Calculation
    const getHourlyPrice = (room, dateObj) => {
        // 1. Determine Day Type
        const day = dateObj.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        let currentDayType = 'WEEKDAY';
        if (day === 5 || day === 6 || day === 0) currentDayType = 'WEEKEND'; // Fri, Sat, Sun

        // 2. Format Time "HH:mm:ss"
        const hours = dateObj.getHours().toString().padStart(2, '0');
        const minutes = dateObj.getMinutes().toString().padStart(2, '0');
        const currentTimeStr = `${hours}:${minutes}:00`;

        // 3. Find matching rules
        if (room.pricing && room.pricing.length > 0) {
            // Filter rules that match the current slot
            const matchingRules = room.pricing.filter(p => {
                // A. Check Specific Date Range first
                if (p.startDateTime && p.endDateTime) {
                    const start = new Date(p.startDateTime);
                    const end = new Date(p.endDateTime);
                    // Match if the slot start falls within the range
                    return dateObj >= start && dateObj < end;
                }

                // B. Check Recurring Day Rule
                if (p.dayType === currentDayType || p.dayType === 'DAILY' || p.dayType === 'HOLIDAY') {
                    const start = p.startTime;
                    const end = p.endTime;

                    if (start < end) {
                        return currentTimeStr >= start && currentTimeStr < end;
                    } else {
                        // Overnight range (e.g. 22:00 to 02:00)
                        return currentTimeStr >= start || currentTimeStr < end;
                    }
                }
                return false;
            });

            if (matchingRules.length > 0) {
                // Pick the rule with HIGHEST priority
                matchingRules.sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0));
                return Number(matchingRules[0].pricePerHour);
            }
        }

        // Default
        return Number(room.hourlyRate || room.pricePerHour || 0);
    };

    const calculateTotalCost = () => {
        let total = 0;
        const startHourStr = bookingData.time; // "HH:mm"
        if (!startHourStr) return 0;

        const [startH] = startHourStr.split(':').map(Number);

        selectedRooms.forEach(room => {
            for (let i = 0; i < bookingData.hours; i++) {
                // Calculate date/time for this specific hour slot
                const slotDate = new Date(bookingDate);
                slotDate.setHours(startH + i, 0, 0, 0);

                total += getHourlyPrice(room, slotDate);
            }
        });

        // Add-ons
        if (bookingData.addOns.birthday) total += 50000;
        if (bookingData.addOns.decoration) total += 30000;

        return total;
    };

    const totalCost = calculateTotalCost();

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex flex-col lg:justify-center lg:items-center justify-end z-[60] p-0 lg:p-4 animate-[fadeIn_0.2s_ease]">
            <div className="bg-[#1a1a24] w-full max-w-[800px] lg:rounded-2xl rounded-t-3xl relative h-full lg:h-auto max-h-[92vh] lg:max-h-[90vh] overflow-hidden border-t lg:border border-white/10 shadow-modal animate-[slideUp_0.3s_ease-out]">
                {/* Mobile Handle */}
                <div className="lg:hidden flex justify-center pt-3 pb-1">
                    <div className="w-16 h-2 bg-white/20 rounded-full"></div>
                </div>

                <button className="absolute top-4 right-5 text-3xl bg-transparent text-text-muted leading-none z-[101] hover:text-white transition-colors lg:block hidden" onClick={onClose}>&times;</button>
                <button className="absolute top-3 right-5 text-2xl bg-transparent text-text-muted leading-none z-[101] hover:text-white lg:hidden block" onClick={onClose}>
                    <i className="pi pi-times-circle"></i>
                </button>

                <div className="h-full overflow-y-auto pb-20 lg:pb-0">
                    <div className="pt-8 px-8 pb-0">
                        <h2 className="text-2xl font-bold mb-1">{venue.name}</h2>
                        <p className="text-text-muted">{venue.district}</p>
                    </div>

                    <div className="p-8 pt-4 lg:pt-8">
                        {/* Step 1: Select Room */}
                        {step === 1 && (
                            <div className="room-selection-step">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-xl font-bold m-0">{t('selectRoom')}</h3>
                                        {(() => {
                                            if (!venue.openingHours) return null;

                                            const hoursMap = getOpeningHoursMap(venue.operatingHours || venue.openingHours);
                                            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                                            const today = getCurrentDayName();
                                            const hours = hoursMap[today] || hoursMap['Daily'];

                                            if (!hours) return null;

                                            try {
                                                const now = new Date();
                                                const [start, end] = hours.split('-');
                                                const [startH, startM] = start.split(':').map(Number);
                                                const [endH, endM] = end.split(':').map(Number);

                                                const startTime = new Date(now);
                                                startTime.setHours(startH, startM, 0);

                                                const endTime = new Date(now);
                                                if (endH < startH) {
                                                    endTime.setDate(endTime.getDate() + 1);
                                                }
                                                endTime.setHours(endH, endM, 0);

                                                const isOpen = now >= startTime && now <= endTime;
                                                return (
                                                    <div className="flex items-center gap-2 bg-white/5 pl-2 pr-1 py-1 rounded-full border border-white/5 group relative">
                                                        <span className="text-[10px] text-gray-400 font-bold tracking-wider ml-1 cursor-help flex items-center gap-1">
                                                            {formatTimeRange(hours)}
                                                            <i className="pi pi-info-circle text-[8px] opacity-50"></i>
                                                        </span>

                                                        {/* Schedule Tooltip */}
                                                        <div className="absolute top-full left-0 mt-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl z-[100] w-48 invisible group-hover:visible transition-all opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 origin-top-left pointer-events-none">
                                                            <p className="m-0 text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 pb-2 border-b border-white/5">{t('fullSchedule')}</p>
                                                            <div className="flex flex-col gap-1.5">
                                                                {dayNames.map(d => {
                                                                    const dayHours = hoursMap[d] || hoursMap['Daily'] || 'Closed';
                                                                    return (
                                                                        <div key={d} className="flex justify-between items-center">
                                                                            <span className={`text-[10px] font-bold ${d === today ? 'text-[#eb79b2]' : 'text-gray-500'}`}>{d}</span>
                                                                            <span className={`text-[10px] font-medium ${d === today ? 'text-white' : 'text-gray-400'}`}>
                                                                                {dayHours !== 'Closed' ? formatTimeRange(dayHours) : 'Closed'}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        <Tag
                                                            value={isOpen ? '🟢 OPEN' : `🔴 CLOSED (Taking bookings)`}
                                                            className={`text-[10px] font-black h-6 ${isOpen ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
                                                            rounded
                                                        />
                                                    </div>
                                                );
                                            } catch (e) {
                                                return <Tag value="INFORMATIONAL" severity="info" rounded />;
                                            }
                                        })()}
                                    </div>
                                    {selectedRooms.length > 0 && (
                                        <div className="px-4 py-2 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] rounded-full">
                                            <span className="font-bold text-white text-sm">
                                                {selectedRooms.length} {t('roomsSelected')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    {(() => {
                                        const org = venue.organization;
                                        const isOrgSuspended = org?.status === 'suspended';
                                        const isVenueDisabled = venue.isBookingEnabled === false;

                                        // Plan validation
                                        const hasPlan = !!org?.planId;
                                        const isPlanExpired = org?.planEndsAt && new Date(org.planEndsAt) < new Date();
                                        const isPlanValid = hasPlan && !isPlanExpired;

                                        const isHardBlocked = isOrgSuspended || isVenueDisabled || !isPlanValid;

                                        return (
                                            <>
                                                {isHardBlocked && (
                                                    <div className="col-span-1 md:col-span-2">
                                                        <div className="bg-surface p-6 rounded-xl border border-primary text-center">
                                                            <div className="p-3 bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                <i className="pi pi-lock text-primary text-2xl"></i>
                                                            </div>
                                                            <p className="font-bold text-xl text-primary mb-2">
                                                                {isOrgSuspended ? "Service Temporarily Unavailable" :
                                                                    (!isPlanValid ? "Organization Subscription Inactive" : t('onlineBookingDisabled'))}
                                                            </p>
                                                            <p className="text-text-muted mb-4">
                                                                {!isPlanValid
                                                                    ? "This organization's booking service has been suspended due to an inactive or expired subscription plan."
                                                                    : "This venue is currently not accepting automated online bookings."}
                                                            </p>
                                                            <div className="inline-block px-6 py-3 bg-white/5 rounded-lg border border-white/10">
                                                                <p className="text-xs text-text-muted font-bold uppercase mb-1">Contact for Assistance</p>
                                                                <h3 className="m-0 font-bold text-xl tracking-wider text-secondary">
                                                                    📞 {venue.phone || '77******'}
                                                                </h3>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {venue.rooms.map(room => {
                                                    const isSelected = selectedRooms.find(r => r.id === room.id);
                                                    const isRoomDisabled = room.isBookingEnabled === false;
                                                    const canSelect = !isHardBlocked && !isRoomDisabled;

                                                    return (
                                                        <div key={room.id}
                                                            className={`bg-white/5 p-4 rounded-xl cursor-pointer transition-all duration-200 border group ${isSelected ? 'border-[#b000ff] bg-[#b000ff]/5 shadow-[0_0_15px_rgba(176,0,255,0.3)]' : 'border-white/5 hover:bg-white/10 hover:border-white/10'}`}
                                                            onClick={() => canSelect && toggleRoomSelection(room)}
                                                            style={{ opacity: canSelect ? 1 : (isHardBlocked ? 0.5 : 0.7) }}
                                                        >
                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 relative">
                                                                <div className="relative w-full sm:w-20 h-32 sm:h-20 flex-shrink-0">
                                                                    <img
                                                                        src={(room.images && room.images.length > 0) ? room.images[0] : defaultRoom}
                                                                        alt={room.name}
                                                                        className="rounded-lg w-full h-full object-cover"
                                                                    />
                                                                    <button
                                                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setPreviewRoom(room);
                                                                        }}
                                                                    >
                                                                        <i className="pi pi-search-plus text-white text-2xl"></i>
                                                                    </button>
                                                                </div>
                                                                <div className="flex-1 w-full">
                                                                    <div className="flex justify-between items-start mb-1 gap-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <h4 className="m-0 font-bold text-base sm:text-lg">{room.name}</h4>
                                                                            <button
                                                                                className="p-0 border-none bg-transparent text-secondary hover:text-white cursor-pointer transition-colors"
                                                                                title="View Details"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setPreviewRoom(room);
                                                                                }}
                                                                            >
                                                                                <i className="pi pi-info-circle text-base"></i>
                                                                            </button>
                                                                        </div>
                                                                        {isRoomDisabled ? (
                                                                            <Tag value="UNAVAILABLE" severity="danger" className="text-[10px] px-2 py-1" />
                                                                        ) : (
                                                                            <Tag value={room.type} severity="info" className="text-xs flex-shrink-0 px-2 py-1" />
                                                                        )}
                                                                    </div>
                                                                    <p className="text-text-muted text-sm mb-2">
                                                                        {room.capacity} {t('capacity')} • {(room.hourlyRate || room.pricePerHour || 0).toLocaleString()}₮
                                                                    </p>
                                                                    <div className="flex gap-1 flex-wrap">
                                                                        {isRoomDisabled ? (
                                                                            <span className="text-[10px] text-red-400 font-bold italic">Maintenance or Temporarily Offline</span>
                                                                        ) : (
                                                                            room.features?.slice(0, 2).map(f => (
                                                                                <span key={f} className="text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 rounded">{f}</span>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {canSelect && (
                                                                    <Checkbox checked={!!isSelected} className="ml-0 sm:ml-2 self-center" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        );
                                    })()}
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="p-3 bg-secondary/20 rounded-lg">
                                            <i className="pi pi-calendar text-secondary text-2xl"></i>
                                        </div>
                                        <div>
                                            <p className="m-0 text-xs text-text-muted font-bold uppercase tracking-widest">{t('bookingDate')}</p>
                                            <Calendar
                                                value={bookingDate}
                                                onChange={(e) => {
                                                    setBookingDate(e.value);
                                                    // Automatic cleanup is no longer strictly needed but good for UX if they switch to a hypothetical blocked date
                                                }}
                                                minDate={new Date()}
                                                maxDate={maxDate}
                                                showIcon
                                                className="w-full sm:w-48 appearance-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                                        <button
                                            onClick={onClose}
                                            className="h-12 px-6 border border-[#b000ff] text-[#b000ff] bg-transparent rounded-lg hover:bg-[#b000ff]/10 hover:text-[#eb79b2] transition-all font-bold flex items-center justify-center gap-2"
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button
                                            disabled={selectedRooms.length === 0}
                                            onClick={handleRoomConfirmation}
                                            className="h-12 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <span className="hidden sm:inline">{t('confirmSelection')}</span>
                                            <span className="sm:hidden">{t('confirm') || 'Confirm'}</span>
                                            {` (${selectedRooms.length})`}
                                        </button>
                                    </div>
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
                                        <div className="flex flex-col gap-2 relative">
                                            <label className="font-bold text-sm text-text-muted">{t('time')}</label>
                                            <Dropdown
                                                value={bookingData.time}
                                                options={availableSlots}
                                                onChange={(e) => setBookingData({ ...bookingData, time: e.value })}
                                                placeholder={loadingSlots ? t('loading') || 'Loading...' : t('selectStartTime')}
                                                className="w-full"
                                                disabled={loadingSlots || availableSlots.length === 0}
                                            />
                                            {loadingSlots && (
                                                <i className="pi pi-spin pi-spinner absolute right-10 top-[38px] text-primary"></i>
                                            )}
                                            {!loadingSlots && availableSlots.length === 0 && selectedRooms.length > 0 && (
                                                <span className="text-[10px] text-red-400 mt-1">{t('noAvailableSlots') || 'No available slots for selected date/rooms'}</span>
                                            )}
                                        </div>
                                        <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                                            <label className="font-bold text-sm text-text-muted">{t('duration')} (Hours)</label>
                                            <InputNumber
                                                value={bookingData.hours}
                                                onValueChange={(e) => setBookingData({ ...bookingData, hours: e.value })}
                                                min={minVenueHours}
                                                max={maxAllowedDuration}
                                                step={minVenueHours === maxVenueHours ? 0 : (Number(venue.minBookingHours) || 1)}
                                                disabled={isFixedDuration}
                                                showButtons={!isFixedDuration}
                                                className="w-full"
                                            />
                                            {isFixedDuration && <span className="text-[10px] text-text-muted">{t('fixedDurationNote') || 'Fixed duration policy applies'}</span>}
                                        </div>
                                    </div>

                                    {selectedRooms.some(r => r.partySupport?.birthday || r.partySupport?.decoration) && (
                                        <div className="bg-white/5 p-4 rounded-xl mb-6 border border-white/10">
                                            <h4 className="m-0 mb-3 font-bold">{t('addOns')}</h4>
                                            <div className="flex flex-col gap-3">
                                                {selectedRooms.some(r => r.partySupport?.birthday) && (
                                                    <div className="flex items-center">
                                                        <Checkbox inputId="birthday" checked={bookingData.addOns.birthday} onChange={e => setBookingData({ ...bookingData, addOns: { ...bookingData.addOns, birthday: e.checked } })} />
                                                        <label htmlFor="birthday" className="ml-3 cursor-pointer text-sm">{t('birthdaySetup')} (+50,000₮)</label>
                                                    </div>
                                                )}
                                                {selectedRooms.some(r => r.partySupport?.decoration) && (
                                                    <div className="flex items-center">
                                                        <Checkbox inputId="decoration" checked={bookingData.addOns.decoration} onChange={e => setBookingData({ ...bookingData, addOns: { ...bookingData.addOns, decoration: e.checked } })} />
                                                        <label htmlFor="decoration" className="ml-3 cursor-pointer text-sm">{t('partyDecoration')} (+30,000₮)</label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mb-6 p-4 bg-surface rounded-xl border border-white/5">
                                        <span className="text-xl font-semibold">{t('total')}:</span>
                                        <span className="text-2xl font-bold text-primary drop-shadow-[0_0_10px_rgba(176,0,255,0.4)]">
                                            {totalCost.toLocaleString()}₮
                                        </span>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="h-12 px-6 border border-[#b000ff] text-[#b000ff] bg-transparent rounded-lg hover:bg-[#b000ff]/10 hover:text-[#eb79b2] transition-all font-bold flex items-center justify-center gap-2"
                                        >
                                            {t('back')}
                                        </button>
                                        <button
                                            type="submit"
                                            className="h-12 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300 flex items-center justify-center gap-2"
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
                                        {totalCost.toLocaleString()}₮
                                    </h2>
                                    <div className="p-4 bg-black/30 rounded-lg text-left inline-block border border-white/5 w-full max-w-sm">
                                        <p className="my-1.5"><span className="text-text-muted mr-2">{t('bankName')}:</span> <span className="font-bold text-white">KHAN BANK</span></p>
                                        <p className="my-1.5"><span className="text-text-muted mr-2">{t('accountNumber')}:</span> <span className="font-bold text-secondary">5070******</span></p>
                                        <p className="my-1.5"><span className="text-text-muted mr-2">{t('accountName')}:</span> <span className="font-bold text-white">UB KARAOKE LLC</span></p>
                                    </div>
                                    <p className="mt-4 text-xs text-text-muted">{t('clickConfirm')}</p>
                                </div>

                                {bookingError && (
                                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm flex items-center gap-2">
                                        <i className="pi pi-exclamation-circle"></i>
                                        {bookingError}
                                    </div>
                                )}

                                <div className="flex justify-center gap-3 mt-6">
                                    <button
                                        onClick={() => setStep(2)}
                                        disabled={isBooking}
                                        className="h-12 px-6 border border-[#b000ff] text-[#b000ff] bg-transparent rounded-lg hover:bg-[#b000ff]/10 hover:text-[#eb79b2] transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {t('back')}
                                    </button>
                                    <button
                                        onClick={handlePayment}
                                        disabled={isBooking}
                                        className="h-12 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {isBooking ? (
                                            <i className="pi pi-spin pi-spinner"></i>
                                        ) : (
                                            <i className="pi pi-check"></i>
                                        )}
                                        {isBooking ? t('processing') || 'Processing...' : t('confirmTransfer')}
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

                {/* Room Preview Dialog */}
                <Dialog
                    header={previewRoom?.name}
                    visible={!!previewRoom}
                    onHide={() => setPreviewRoom(null)}
                    className="w-full max-w-2xl bg-[#1a1a24]"
                    contentClassName="p-0 overflow-hidden"
                    headerClassName="bg-[#1a1a24] text-white border-b border-white/5 p-6"
                >
                    {previewRoom && (
                        <div className="flex flex-col max-h-[80vh] overflow-y-auto">
                            {/* Gallery */}
                            <div className="w-full bg-black/40">
                                {previewRoom.images && previewRoom.images.length > 0 ? (
                                    <Galleria
                                        value={previewRoom.images.map(img => ({ itemImageSrc: img }))}
                                        numVisible={5}
                                        circular
                                        showItemNavigators
                                        showThumbnails={previewRoom.images.length > 1}
                                        item={(item) => <img src={item.itemImageSrc} alt="Room" style={{ width: '100%', height: '350px', objectCover: 'cover', display: 'block' }} />}
                                        thumbnail={(item) => <img src={item.itemImageSrc} alt="Thumbnail" style={{ width: '60px', height: '40px', objectCover: 'cover', display: 'block' }} />}
                                    />
                                ) : (
                                    <img src={defaultRoom} alt="Default Room" className="w-full h-[350px] object-cover" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <Tag value={previewRoom.type} severity="info" className="px-2 py-1" />
                                            {previewRoom.isVIP && <Tag value="VIP" severity="warning" className="font-bold px-2 py-1" />}
                                        </div>
                                        <p className="m-0 text-text-muted flex items-center gap-2">
                                            <i className="pi pi-users"></i> Up to {previewRoom.capacity} People
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="m-0 text-2xl font-black text-[#eb79b2]">{(previewRoom.hourlyRate || 0).toLocaleString()}₮</p>
                                        <p className="m-0 text-xs text-text-muted font-bold uppercase tracking-widest">per hour</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="flex items-center gap-2 text-white mb-4 uppercase tracking-widest text-xs font-black">
                                            <i className="pi pi-list text-secondary"></i> Technical Specifications
                                        </h4>
                                        <ul className="list-none p-0 m-0 flex flex-col gap-3">
                                            <li className="flex justify-between text-sm py-2 border-b border-white/5">
                                                <span className="text-text-muted">Microphones</span>
                                                <span className="font-bold text-white">{previewRoom.specs?.microphones || 2} Wireless</span>
                                            </li>
                                            <li className="flex justify-between text-sm py-2 border-b border-white/5">
                                                <span className="text-text-muted">Screen Size</span>
                                                <span className="font-bold text-white">{previewRoom.specs?.screen || 55}" LED</span>
                                            </li>
                                            <li className="flex justify-between text-sm py-2 border-b border-white/5">
                                                <span className="text-text-muted">Seating</span>
                                                <span className="font-bold text-white">{previewRoom.specs?.seating || 'Standard'}</span>
                                            </li>
                                            <li className="flex justify-between text-sm py-2 border-b border-white/5">
                                                <span className="text-text-muted">Sound System</span>
                                                <span className="font-bold text-white">{previewRoom.specs?.sound || 'Professional'}</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="flex items-center gap-2 text-white mb-4 uppercase tracking-widest text-xs font-black">
                                            <i className="pi pi-star text-secondary"></i> Features & Amenities
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {previewRoom.features?.map(f => (
                                                <span key={f} className="text-[10px] font-bold text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-full uppercase tracking-tighter">
                                                    {f}
                                                </span>
                                            ))}
                                            {previewRoom.amenities?.map(a => (
                                                <span key={a} className="text-[10px] font-bold text-secondary bg-secondary/5 border border-secondary/20 px-3 py-1.5 rounded-full uppercase tracking-tighter">
                                                    {a}
                                                </span>
                                            ))}
                                        </div>

                                        {previewRoom.view360Url && (
                                            <div className="mt-8">
                                                <a
                                                    href={previewRoom.view360Url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full flex items-center justify-center gap-3 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold no-underline hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                                                >
                                                    <i className="pi pi-eye"></i>
                                                    ENTER 360° VIRTUAL TOUR
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Divider className="border-white/5 my-8" />

                                <div className="flex justify-center">
                                    <button
                                        className={`h-12 px-12 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${selectedRooms.find(r => r.id === previewRoom.id)
                                            ? 'bg-transparent border border-[#ff3d32] text-[#ff3d32] hover:bg-[#ff3d32]/10'
                                            : 'bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white hover:shadow-[0_0_20px_rgba(176,0,255,0.4)]'
                                            }`}
                                        onClick={() => {
                                            toggleRoomSelection(previewRoom);
                                            setPreviewRoom(null);
                                        }}
                                    >
                                        {selectedRooms.find(r => r.id === previewRoom.id) ? 'Deselect Room' : 'Select This Room'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </Dialog>

                <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                :global(.p-dialog .p-dialog-header) {
                    background: #1a1a24 !important;
                    color: white !important;
                }
                :global(.p-dialog .p-dialog-content) {
                    background: #1a1a24 !important;
                    color: white !important;
                }
                :global(.p-galleria-item-nav), :global(.p-galleria-thumbnail-nav) {
                    background: rgba(0,0,0,0.5) !important;
                    color: white !important;
                }
            `}</style>
            </div >
        </div >
    );
};

export default BookingModal;
