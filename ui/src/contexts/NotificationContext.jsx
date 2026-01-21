import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useData } from './DataContext';
import { api } from '../utils/api';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { currentUser } = useData();
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [connected, setConnected] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!currentUser) return;
        try {
            const data = await api.getUserNotifications();
            setNotifications(data);
            const countData = await api.getUnreadCount();
            setUnreadCount(countData.count);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            fetchNotifications();

            const hostname = window.location.hostname;
            const newSocket = io(`http://${hostname}:3001`, {
                query: { userId: currentUser.id },
                transports: ['websocket'],
                withCredentials: true
            });

            newSocket.on('connect', () => {
                setConnected(true);
                console.log('Connected to notification gateway');

                // If user is staff, join organization room
                if (currentUser.role === 'staff' || currentUser.role === 'manager' || currentUser.role === 'admin') {
                    newSocket.emit('join-organization', { organizationId: currentUser.organizationId });
                }
            });

            newSocket.on('disconnect', () => {
                setConnected(false);
                console.log('Disconnected from notification gateway');
            });

            // Listen for various booking events
            const handleBookingEvent = (data) => {
                console.log('New booking event:', data);
                fetchNotifications(); // Refresh list and count

                // We can also trigger a toast here if we had a toast context
                // Or let the components handle it by listening to notifications state
            };

            newSocket.on('booking:reserved', handleBookingEvent);
            newSocket.on('booking:approved', handleBookingEvent);
            newSocket.on('booking:confirmed', handleBookingEvent);
            newSocket.on('booking:rejected', handleBookingEvent);
            newSocket.on('booking:expired', handleBookingEvent);
            newSocket.on('booking:reminder', handleBookingEvent);
            newSocket.on('booking:status_updated', handleBookingEvent);
            newSocket.on('notification:new', handleBookingEvent);

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else {
            setSocket(null);
            setConnected(false);
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [currentUser, fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            await api.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date() })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await api.deleteNotification(id);
            const notifToDelete = notifications.find(n => n.id === id);
            if (notifToDelete && !notifToDelete.readAt) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            connected,
            socket,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            refresh: fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
