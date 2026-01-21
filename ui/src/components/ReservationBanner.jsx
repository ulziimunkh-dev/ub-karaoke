import React from 'react';
import { useData } from '../contexts/DataContext';
import BookingCountdown from './BookingCountdown';
import { useLocation } from 'react-router-dom';

const ReservationBanner = () => {
    const { activeBooking, extendBookingReservation, isExtending, setActiveBooking } = useData();
    const location = useLocation();

    // Don't show if no active booking or if it's not in RESERVED status
    if (!activeBooking || (activeBooking.status !== 'RESERVED' && activeBooking.status !== 'reserved')) return null;

    // Hide in administrative areas
    if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/staff') || location.pathname.startsWith('/sysadmin')) {
        return null;
    }

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-lg animate-slide-down">
            <div className="bg-[#1a1a24]/98 backdrop-blur-2xl border-2 border-[#b000ff]/40 rounded-2xl p-4 shadow-[0_30px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(176,0,255,0.3)]">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                        </span>
                        <span className="text-white text-sm font-black uppercase tracking-widest bg-red-600/20 px-2 py-0.5 rounded">Action Required: Complete Booking</span>
                    </div>
                    <button
                        onClick={() => setActiveBooking(null)}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                        title="Dismiss Banner"
                    >
                        <i className="pi pi-times text-sm"></i>
                    </button>
                </div>

                <div className="bg-black/40 rounded-xl p-1 mb-1">
                    <BookingCountdown
                        booking={activeBooking}
                        onExpired={() => {
                            setActiveBooking(null);
                        }}
                        onExtend={() => extendBookingReservation(activeBooking.id)}
                        isExtending={isExtending}
                    />
                </div>
                <p className="text-[10px] text-gray-500 text-center mt-2 uppercase font-bold tracking-tighter">
                    Your room is being held. please complete transfer to avoid cancellation.
                </p>
            </div>

            <style>{`
                @keyframes slideDown {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                .animate-slide-down {
                    animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
};

export default ReservationBanner;
