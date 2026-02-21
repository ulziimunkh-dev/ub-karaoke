import React, { useState, useEffect, useCallback } from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useLanguage } from '../contexts/LanguageContext';

const BookingCountdown = ({ booking, onExpired, onExtend, isExtending }) => {
    const { t } = useLanguage();
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
        return <Message severity="error" text={t('reservationExpired')} style={{ width: '100%' }} />;
    }

    return (
        <div className="booking-countdown p-3 border-round surface-card shadow-1 mb-3">
            <div className="flex justify-between items-center mb-2 w-full">
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{t('expiresIn')}</span>
                <span className={`text-xl font-black ${status === 'error' ? 'text-red-500' : status === 'warn' ? 'text-orange-500' : 'text-blue-400'} tabular-nums`}>
                    {formatTime(timeLeft)}
                </span>
            </div>

            <ProgressBar
                value={percentage}
                showValue={false}
                style={{ height: '8px' }}
                color={status === 'error' ? '#ef4444' : status === 'warn' ? '#f59e0b' : '#3b82f6'}
            />

            {/* Extension feature disabled */}
            <div className="mt-3" />

            {status === 'error' && (
                <div className="mt-2 scalein animation-duration-500">
                    <Message severity="warn" text={t('hurryMessage')} style={{ width: '100%', fontSize: '12px' }} />
                </div>
            )}
        </div>
    );
};

export default BookingCountdown;
