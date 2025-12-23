import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    // --- STATE ---
    const [venues, setVenues] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            // Load venues
            const rawVenues = await api.getVenues();

            // Fix potential JSON string issues from API
            const safeParse = (data) => {
                if (typeof data === 'string') {
                    try { return JSON.parse(data); } catch (e) { return data; }
                }
                return data;
            };

            const processedVenues = rawVenues.map(v => ({
                ...v,
                amenities: safeParse(v.amenities),
                openingHours: safeParse(v.openingHours),
                images: safeParse(v.images),
                rooms: v.rooms?.map(r => ({
                    ...r,
                    amenities: safeParse(r.amenities),
                    features: safeParse(r.features),
                    images: safeParse(r.images),
                    specs: safeParse(r.specs),
                    partySupport: safeParse(r.partySupport)
                }))
            }));

            setVenues(processedVenues);

            // Check if user is logged in
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const userData = await api.getProfile();
                    setCurrentUser(userData);

                    // Load users if admin
                    if (userData.role === 'admin' || userData.role === 'staff') {
                        try {
                            const usersData = await api.getUsers();
                            setUsers(usersData);
                        } catch (error) {
                            console.error('Failed to load users:', error);
                        }
                    }
                } catch (error) {
                    // Token expired or invalid
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user');
                }
            }
        } catch (error) {
            console.error('Failed to load initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- AUTH ---
    const handleLoginSuccess = async (data) => {
        setCurrentUser(data.user);
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        if (data.user.role === 'admin' || data.user.role === 'staff') {
            try {
                const usersData = await api.getUsers();
                setUsers(usersData);
            } catch (error) {
                console.error('Failed to load users:', error);
            }
        }
    };

    const login = async (identifier, password) => {
        try {
            const data = await api.login(identifier, password);
            setCurrentUser(data.user);
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            handleLoginSuccess(data);
            return data.user;
        } catch (error) {
            console.error('Login failed:', error);
            return null;
        }
    };

    const loginWithOtp = async (identifier, code) => {
        try {
            const data = await api.loginWithOtp(identifier, code);
            handleLoginSuccess(data);
            return data.user;
        } catch (error) {
            console.error('OTP Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
    };

    const registerCustomer = async data => {
        try {
            const response = await api.signup(data);
            setCurrentUser(response.user);
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));
            return response.user;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const updatedUser = await api.updateProfile(profileData);
            setCurrentUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        } catch (error) {
            console.error('Profile update failed:', error);
            throw error;
        }
    };

    // --- VENUES ---
    const addVenue = async venueData => {
        try {
            const newVenue = await api.createVenue(venueData);
            const venueWithRooms = { ...newVenue, rooms: [] };
            setVenues(prev => [...prev, venueWithRooms]);
            return venueWithRooms;
        } catch (error) {
            console.error('Failed to create venue:', error);
            throw error;
        }
    };

    const updateVenue = async (id, updates) => {
        try {
            const updated = await api.updateVenue(id, updates);
            setVenues(prev => prev.map(v => (v.id === id ? { ...v, ...updated } : v)));
            return updated;
        } catch (error) {
            console.error('Failed to update venue:', error);
            throw error;
        }
    };

    const deleteVenue = async id => {
        try {
            await api.deleteVenue(id);
            setVenues(prev => prev.filter(v => v.id !== id));
        } catch (error) {
            console.error('Failed to delete venue:', error);
            throw error;
        }
    };

    // --- BOOKINGS ---
    const addBooking = async bookingData => {
        try {
            const newBooking = await api.createBooking(bookingData);
            setBookings(prev => [newBooking, ...prev]);
            return newBooking;
        } catch (error) {
            console.error('Failed to create booking:', error);
            throw error;
        }
    };

    const updateBookingStatus = async (id, status) => {
        try {
            await api.updateBooking(id, { status });
            setBookings(prev => prev.map(b => (b.id === id ? { ...b, status } : b)));
        } catch (error) {
            console.error('Failed to update booking status:', error);
            throw error;
        }
    };

    const approveBooking = async (id) => {
        try {
            const updated = await api.approveBooking(id);
            setBookings(prev => prev.map(b => (b.id === id ? updated : b)));
            return updated;
        } catch (error) {
            console.error('Failed to approve booking:', error);
            throw error;
        }
    };

    const rejectBooking = async (id) => {
        try {
            const updated = await api.rejectBooking(id);
            setBookings(prev => prev.map(b => (b.id === id ? updated : b)));
            return updated;
        } catch (error) {
            console.error('Failed to reject booking:', error);
            throw error;
        }
    };

    const createManualBooking = async (bookingData) => {
        try {
            const newBooking = await api.createManualBooking(bookingData);
            setBookings(prev => [newBooking, ...prev]);
            return newBooking;
        } catch (error) {
            console.error('Failed to create manual booking:', error);
            throw error;
        }
    };

    // --- CALCULATIONS ---
    const calculateTotal = (hourlyRate, hours, addOns = {}) => {
        let subtotal = hourlyRate * hours;
        if (addOns.birthday) subtotal += 50000;
        if (addOns.decoration) subtotal += 30000;

        const settings = {
            taxRate: 0.1,
            serviceCharge: 0.05
        };

        const service = subtotal * settings.serviceCharge;
        const tax = subtotal * settings.taxRate;
        return {
            subtotal,
            service,
            tax,
            total: subtotal + service + tax
        };
    };

    // Room management with API
    const addRoom = async (venueId, roomData) => {
        try {
            const data = {
                ...roomData,
                venueId: Number(venueId),
                condition: roomData.condition || 'Good',
                amenities: roomData.amenities || [],
                features: roomData.features || [],
                images: roomData.images || [],
                specs: roomData.specs || { microphones: 2, speaker: 'Standard', screen: 55, seating: 'Sofa', ac: 'Manual', sound: 'Medium', lighting: ['Normal'], cleaning: 15 },
                partySupport: roomData.partySupport || { birthday: false, decoration: false }
            };
            const newRoom = await api.createRoom(data);
            setVenues(prev =>
                prev.map(v => {
                    if (v.id === venueId) {
                        return { ...v, rooms: [...(v.rooms || []), newRoom] };
                    }
                    return v;
                })
            );
            return newRoom;
        } catch (error) {
            console.error('Failed to add room:', error);
            throw error;
        }
    };

    const updateRoom = async (venueId, roomId, updates) => {
        try {
            const updated = await api.updateRoom(roomId, updates);
            setVenues(prev =>
                prev.map(v => {
                    if (v.id === venueId) {
                        return {
                            ...v,
                            rooms: v.rooms.map(r => (r.id === roomId ? { ...r, ...updated } : r))
                        };
                    }
                    return v;
                })
            );
            return updated;
        } catch (error) {
            console.error('Failed to update room:', error);
            throw error;
        }
    };

    const deleteRoom = async (venueId, roomId) => {
        try {
            await api.deleteRoom(roomId);
            setVenues(prev =>
                prev.map(v => {
                    if (v.id === venueId) {
                        return {
                            ...v,
                            rooms: v.rooms.filter(r => r.id !== roomId)
                        };
                    }
                    return v;
                })
            );
        } catch (error) {
            console.error('Failed to delete room:', error);
            throw error;
        }
    };

    const updateRoomStatus = (venueId, roomId, status) => {
        updateRoom(venueId, roomId, { status });
    };

    const processRefund = bookingId => {
        updateBookingStatus(bookingId, 'Refunded');
    };

    const addOrder = (bookingId, items) => {
        setBookings(prev =>
            prev.map(b => {
                if (b.id === bookingId) {
                    const orderTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
                    const newOrders = [...(b.orders || []), ...items];
                    return {
                        ...b,
                        orders: newOrders,
                        total: b.total + orderTotal
                    };
                }
                return b;
            })
        );
    };

    const logIssue = (bookingId, type, description) => {
        setBookings(prev =>
            prev.map(b => {
                if (b.id === bookingId) {
                    return {
                        ...b,
                        issues: [...(b.issues || []), { type, description, date: new Date().toISOString() }]
                    };
                }
                return b;
            })
        );
    };

    const verifyPromoCode = code => {
        const promos = [
            { code: 'WELCOME', discountPercent: 10, expiry: '2025-12-31' },
            { code: 'VIP100', discountAmount: 100000, expiry: '2025-12-31' }
        ];
        return promos.find(p => p.code === code) || null;
    };

    // User management mock functions
    const addUser = async (userData) => {
        try {
            const newUser = await api.createUser(userData);
            setUsers(prev => [newUser, ...prev]);
            return newUser;
        } catch (error) {
            console.error('Failed to add user:', error);
            throw error;
        }
    };
    const updateUser = (id, updates) => { };
    const toggleUserStatus = id => { };
    const transactions = [];
    const settings = {
        taxRate: 0.1,
        serviceCharge: 0.05,
        currency: 'MNT',
        depositFixed: 50000
    };
    const setSettings = () => { };
    const promos = [];

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <DataContext.Provider
            value={{
                venues,
                addVenue,
                updateVenue,
                deleteVenue,
                addRoom,
                updateRoom,
                deleteRoom,
                updateRoomStatus,
                users,
                currentUser,
                login,
                logout,
                registerCustomer,
                loginWithOtp,
                verifyAccount: api.verifyAccount,
                requestLoginOtp: api.requestLoginOtp,
                forgotPassword: api.forgotPassword,
                resetPassword: api.resetPassword,
                updateProfile,
                addUser,
                updateUser,
                toggleUserStatus,
                bookings,
                addBooking,
                updateBookingStatus,
                approveBooking,
                rejectBooking,
                createManualBooking,
                processRefund,
                calculateTotal,
                addOrder,
                logIssue,
                transactions,
                settings,
                setSettings,
                promos,
                verifyPromoCode
            }}
        >
            {children}
        </DataContext.Provider>
    );
};
