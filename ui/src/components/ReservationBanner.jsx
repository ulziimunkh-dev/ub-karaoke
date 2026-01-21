import React from 'react';
import { useData } from '../contexts/DataContext';
import BookingCountdown from './BookingCountdown';
import { useLocation } from 'react-router-dom';

const ReservationBanner = () => {
    const { activeBooking, extendBookingReservation, isExtending, setActiveBooking, setShowResumeModal } = useData();
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
                            setShowResumeModal(false);
                        }}
                        onExtend={() => extendBookingReservation(activeBooking.id)}
                        isExtending={isExtending}
                    />
                </div>

                <div className="flex flex-col gap-2 mt-3">
                    <button
                        onClick={() => setShowResumeModal(true)}
                        className="w-full py-2.5 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(176,0,255,0.4)] hover:shadow-[0_0_30px_rgba(176,0,255,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all animate-pulse-slow"
                    >
                        Complete Payment Now
                    </button>

                    <p className="text-[10px] text-gray-500 text-center uppercase font-bold tracking-tighter">
                        Your room is being held. please complete transfer to avoid cancellation.
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes slideDown {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.02); opacity: 0.9; }
                }
                .animate-slide-down {
                    animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .animate-pulse-slow {
                    animation: pulse-slow 3s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default ReservationBanner;
