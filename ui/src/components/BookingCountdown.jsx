import React, { useState, useEffect, useCallback } from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

const BookingCountdown = ({ booking, onExpired, onExtend, isExtending }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [percentage, setPercentage] = useState(100);
    const [status, setStatus] = useState('info'); // info, warn, error

    const calculateTimeLeft = useCallback(() => {
        if (!booking?.expiresAt) return 0;
        const expiry = new Date(booking.expiresAt).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((expiry - now) / 1000));
        return diff;
    }, [booking?.expiresAt]);

    useEffect(() => {
        const initialDiff = calculateTimeLeft();
        setTimeLeft(initialDiff);

        const timer = setInterval(() => {
            const newDiff = calculateTimeLeft();
            setTimeLeft(newDiff);

            if (newDiff <= 0) {
                clearInterval(timer);
                if (onExpired) onExpired();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [calculateTimeLeft, onExpired]);

    useEffect(() => {
        // Assume initial reservation is 15 minutes (900 seconds)
        // or calculate based on reservedAt if available
        const totalTime = 900 + (booking.extensionCount || 0) * 300;
        const currentPercentage = (timeLeft / totalTime) * 100;
        setPercentage(Math.min(100, Math.max(0, currentPercentage)));

        if (timeLeft > 300) setStatus('info');
        else if (timeLeft > 60) setStatus('warn');
        else setStatus('error');
    }, [timeLeft, booking.extensionCount]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (timeLeft <= 0) {
        return <Message severity="error" text="Reservation Expired" style={{ width: '100%' }} />;
    }

    return (
        <div className="booking-countdown p-3 border-round surface-card shadow-1 mb-3">
            <div className="flex justify-content-between align-items-center mb-2">
                <span className="text-sm font-semibold text-color-secondary">Reservation Expires In:</span>
                <span className={`text-xl font-bold ${status === 'error' ? 'text-red-500' : status === 'warn' ? 'text-orange-500' : 'text-blue-500'}`}>
                    {formatTime(timeLeft)}
                </span>
            </div>

            <ProgressBar
                value={percentage}
                showValue={false}
                style={{ height: '8px' }}
                color={status === 'error' ? '#ef4444' : status === 'warn' ? '#f59e0b' : '#3b82f6'}
            />

            <div className="flex justify-content-between align-items-center mt-3">
                <p className="text-xs text-color-secondary m-0">
                    {booking.extensionCount < 3
                        ? `Extensions used: ${booking.extensionCount}/3`
                        : 'Maximum extensions reached'}
                </p>
                {booking.extensionCount < 3 && (
                    <Button
                        label="+5 Min"
                        icon="pi pi-plus"
                        size="small"
                        text
                        onClick={onExtend}
                        loading={isExtending}
                        disabled={timeLeft > 300} // Only allow extension when less than 5 min left
                        tooltip="Extend reservation by 5 minutes"
                        tooltipOptions={{ position: 'bottom' }}
                    />
                )}
            </div>

            {status === 'error' && (
                <div className="mt-2 scalein animation-duration-500">
                    <Message severity="warn" text="Hurry! Complete your payment to secure this room." style={{ width: '100%', fontSize: '12px' }} />
                </div>
            )}
        </div>
    );
};

export default BookingCountdown;
