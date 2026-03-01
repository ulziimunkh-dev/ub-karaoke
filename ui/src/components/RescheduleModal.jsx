import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';
import { api } from '../../utils/api';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * RescheduleModal — lets customers or staff pick a new time for a confirmed booking.
 * Props:
 *   visible        – boolean
 *   onHide         – () => void
 *   booking        – the Booking object (needs id, startTime, endTime, rescheduleCount)
 *   onSuccess      – (updatedBooking) => void
 *   isStaff        – boolean (disables 1h restriction hint in UI)
 */
const RescheduleModal = ({ visible, onHide, booking, onSuccess, isStaff = false }) => {
    const { t, language } = useLanguage();
    const [selectedDate, setSelectedDate] = useState(null);
    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [savedBooking, setSavedBooking] = useState(null);

    // Reset state when modal opens with a new booking
    useEffect(() => {
        if (visible) {
            setSelectedDate(null);
            setSlots([]);
            setSelectedSlot(null);
            setError(null);
            setSuccess(false);
            setSavedBooking(null);
        }
    }, [visible, booking?.id]);

    // Fetch slots when date changes
    useEffect(() => {
        if (!selectedDate || !booking?.id) return;
        const dateStr = selectedDate.toISOString().split('T')[0];
        setSlotsLoading(true);
        setSelectedSlot(null);
        setError(null);
        api.getRescheduleSlots(booking.id, dateStr)
            .then(setSlots)
            .catch((e) => setError(e.response?.data?.message || 'Failed to load available slots'))
            .finally(() => setSlotsLoading(false));
    }, [selectedDate, booking?.id]);

    const handleConfirm = async () => {
        if (!selectedSlot) return;
        setConfirming(true);
        setError(null);
        try {
            const updated = await api.rescheduleBooking(booking.id, selectedSlot.startTime);
            setSavedBooking(updated);
            setSuccess(true);
            onSuccess?.(updated);
        } catch (e) {
            setError(e.response?.data?.message || 'Reschedule failed. Please try again.');
        } finally {
            setConfirming(false);
        }
    };

    const duration = booking
        ? Math.round((new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60) * 10) / 10
        : 0;

    const remainingReschedules = isStaff ? '∞' : Math.max(0, 3 - (booking?.rescheduleCount ?? 0));

    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1); // at minimum tomorrow

    return (
        <Dialog
            header={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center">
                        <i className="pi pi-calendar-plus text-white"></i>
                    </div>
                    <div>
                        <p className="m-0 text-white font-bold">{t('changeTime')}</p>
                        <p className="m-0 text-[10px] text-gray-500 uppercase tracking-widest">{duration}h {t('sessionSameRoom') || 'session · same room'}</p>
                    </div>
                </div>
            }
            visible={visible}
            onHide={onHide}
            className="w-full max-w-lg"
            modal
        >
            {success ? (
                /* ── Success State ── */
                <div className="text-center py-8">
                    <i className="pi pi-check-circle text-5xl text-green-400 mb-4 block"></i>
                    <h3 className="text-xl font-bold text-white mb-2">{t('bookingRescheduled')}</h3>
                    {savedBooking && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">{t('newTime')}</p>
                            <p className="text-white font-bold">
                                {new Date(savedBooking.startTime).toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-[#b000ff] font-black">
                                {new Date(savedBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                {' → '}
                                {new Date(savedBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </p>
                        </div>
                    )}
                    <button
                        onClick={onHide}
                        className="h-11 px-8 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-xl"
                    >
                        {t('done')}
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-5 pt-2">
                    {/* Info bar */}
                    <div className="flex flex-wrap gap-3">
                        <div className="bg-white/5 rounded-xl border border-white/10 px-4 py-3 flex-1">
                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">{t('currentTime')}</p>
                            <p className="text-white font-bold text-sm">
                                {booking ? new Date(booking.startTime).toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US', { month: 'short', day: 'numeric' }) : '—'}
                                {' '}
                                <span className="text-[#b000ff]">
                                    {booking ? new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                                </span>
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-xl border border-white/10 px-4 py-3 flex-1">
                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">{t('reschedulesLeft')}</p>
                            <p className={`font-black text-sm ${remainingReschedules === 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {remainingReschedules}
                            </p>
                        </div>
                    </div>

                    {!isStaff && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-400">
                            <i className="pi pi-info-circle mr-2"></i>
                            {t('rescheduleInfo')}
                        </div>
                    )}

                    {/* Date picker */}
                    <div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">{t('chooseDateStep')}</p>
                        <Calendar
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.value)}
                            minDate={new Date()}
                            inline
                            className="w-full reschedule-calendar"
                            showOtherMonths={false}
                            panelClassName="bg-[#1a1a24] border-white/10 rounded-2xl"
                        />
                    </div>

                    {/* Slot grid */}
                    {selectedDate && (
                        <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">
                                {t('chooseTimeStep')} — {selectedDate.toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                            {slotsLoading ? (
                                <div className="text-center py-6">
                                    <i className="pi pi-spin pi-spinner text-2xl text-[#b000ff]"></i>
                                </div>
                            ) : slots.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">{t('noSlotsOnDate')}</p>
                            ) : (
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                                    {slots.map((slot) => {
                                        const isCurrent =
                                            booking &&
                                            new Date(slot.startTime).getTime() === new Date(booking.startTime).getTime();
                                        const isSelected = selectedSlot?.startTime === slot.startTime;

                                        return (
                                            <button
                                                key={slot.startTime}
                                                disabled={!slot.available}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={[
                                                    'py-2 px-1 rounded-xl text-xs font-bold transition-all border',
                                                    isCurrent
                                                        ? 'border-[#b000ff]/50 text-[#b000ff] bg-[#b000ff]/10 cursor-default'
                                                        : !slot.available
                                                            ? 'border-white/5 text-gray-700 bg-white/[0.02] cursor-not-allowed line-through'
                                                            : isSelected
                                                                ? 'border-[#b000ff] bg-gradient-to-br from-[#b000ff] to-[#eb79b2] text-white shadow-[0_0_16px_rgba(176,0,255,0.5)]'
                                                                : 'border-white/10 text-white hover:border-[#b000ff]/40 hover:bg-[#b000ff]/10',
                                                ].join(' ')}
                                            >
                                                {isCurrent ? (
                                                    <span title="Current time">{slot.time} ★</span>
                                                ) : (
                                                    slot.time
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Selected summary */}
                    {selectedSlot && (
                        <div className="bg-[#b000ff]/10 border border-[#b000ff]/30 rounded-xl p-4">
                            <p className="text-[9px] text-[#b000ff] font-black uppercase tracking-widest mb-1">{t('newTime')}</p>
                            <p className="text-white font-bold">
                                {new Date(selectedSlot.startTime).toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                {' — '}
                                {new Date(selectedSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                {' → '}
                                {new Date(selectedSlot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">{duration}h · same room · same price</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                            <i className="pi pi-exclamation-circle mr-2"></i>{error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onHide}
                            disabled={confirming}
                            className="h-11 flex-1 border border-white/10 text-white/60 bg-transparent rounded-xl hover:bg-white/5 transition-all font-bold"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedSlot || confirming}
                            className="h-11 flex-1 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            {confirming && <i className="pi pi-spin pi-spinner"></i>}
                            {confirming ? t('rescheduling') : t('confirmReschedule')}
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .reschedule-calendar .p-datepicker { background: transparent !important; border: none !important; width: 100% !important; }
                .reschedule-calendar .p-datepicker table td > span { border-radius: 8px; }
                .reschedule-calendar .p-datepicker table td > span.p-highlight { background: linear-gradient(135deg, #b000ff, #eb79b2) !important; color: white !important; }
                .reschedule-calendar .p-datepicker:not(.p-disabled) table td span:not(.p-disabled):hover { background: rgba(176,0,255,0.2) !important; }
                .reschedule-calendar .p-datepicker .p-datepicker-header { background: transparent !important; border: none !important; color: white !important; }
                .reschedule-calendar .p-datepicker table th span { color: #666 !important; }
                .reschedule-calendar .p-datepicker table td span { color: white !important; }
                .reschedule-calendar .p-datepicker table td.p-datepicker-other-month span { color: #444 !important; }
                .reschedule-calendar .p-datepicker table td.p-disabled span { color: #333 !important; }
            `}</style>
        </Dialog>
    );
};

export default RescheduleModal;
