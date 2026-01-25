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
    const [staffs, setStaffs] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [roomFeatures, setRoomFeatures] = useState([]);
    const [earnings, setEarnings] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [payoutAccounts, setPayoutAccounts] = useState([]);
    const [activeVenueId, _setActiveVenueId] = useState(null);
    const setActiveVenueId = (id) => {
        _setActiveVenueId(id);
        if (id) localStorage.setItem('activeVenueId', id);
    };
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        taxRate: 0.1,
        serviceCharge: 0.05,
        currency: 'MNT',
        depositFixed: 50000
    });
    const [promos, setPromos] = useState([]);
    const [activeBooking, setActiveBooking] = useState(null);
    const [isExtending, setIsExtending] = useState(false);
    const [showResumeModal, setShowResumeModal] = useState(false);


    // Load initial data
    // Load initial data
    useEffect(() => {
        // [NEW] Magic Link Setup Logic
        const params = new URLSearchParams(window.location.search);
        const setupOrg = params.get('setup_org');
        if (setupOrg) {
            localStorage.setItem('device_org_code', setupOrg);
            // Clean URL without refresh
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.pushState({ path: newUrl }, '', newUrl);
            alert(`Device successfully configured for Organization: ${setupOrg}`);
        }

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

                    // Load role-specific data
                    if (userData.role === 'sysadmin') {
                        try {
                            const [orgsData, usersData, staffData, bookingsData, earningsData, payoutsData] = await Promise.all([
                                api.getOrganizations(),
                                api.getUsers(),
                                api.getStaff(),
                                api.getBookings(),
                                api.getEarnings(),
                                api.getPayouts()
                            ]);
                            setOrganizations(orgsData);
                            setUsers(usersData);
                            setStaffs(staffData);
                            setBookings(bookingsData);
                            setEarnings(earningsData);
                            setPayouts(payoutsData);
                        } catch (error) {
                            console.error('Failed to load sysadmin data:', error);
                        }
                    } else if (userData.role === 'manager' || userData.role === 'staff') {
                        try {
                            const [staffData, bookingsData, earningsData, payoutsData, accountsData, usersData] = await Promise.all([
                                api.getStaff(),
                                api.getBookings({ organizationId: userData.organizationId }),
                                api.getEarnings(),
                                api.getPayouts(),
                                api.getPayoutAccounts(),
                                api.getUsers()
                            ]);
                            setStaffs(staffData);
                            setBookings(bookingsData);
                            setEarnings(earningsData);
                            setPayouts(payoutsData);
                            setPayoutAccounts(accountsData);
                            setUsers(usersData);

                            // Set activeVenueId
                            const orgVenues = processedVenues.filter(v => v.organizationId === userData.organizationId);
                            if (orgVenues.length > 0) {
                                const savedVenueId = localStorage.getItem('activeVenueId');
                                if (savedVenueId && orgVenues.some(v => v.id === savedVenueId)) {
                                    setActiveVenueId(savedVenueId);
                                } else {
                                    setActiveVenueId(orgVenues[0].id);
                                }
                            }
                        } catch (error) {
                            console.error('Failed to load manager/staff data:', error);
                        }
                    } else {
                        // Customer
                        try {
                            const myBookings = await api.getBookings();
                            setBookings(myBookings);
                            // Detect active reservation
                            const activeRes = myBookings.find(b => b.status?.toUpperCase() === 'RESERVED');
                            if (activeRes) {
                                setActiveBooking(activeRes);
                            }
                        } catch (error) {
                            console.error('Failed to load customer bookings:', error);
                        }
                    }

                    // Global config for all admins
                    if (['sysadmin', 'manager', 'staff'].includes(userData.role)) {
                        try {
                            const [types, features, promotions] = await Promise.all([
                                api.getRoomTypes(),
                                api.getRoomFeatures(),
                                api.getPromotions()
                            ]);
                            setRoomTypes(types);
                            setRoomFeatures(features);
                            setPromos(promotions);
                        } catch (e) {
                            console.error('Failed to load room/promo config:', e);
                        }
                    }
                } catch (error) {
                    console.error('Session validation failed:', error);
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

        if (data.user.role === 'sysadmin') {
            try {
                const [orgsData, usersData, staffData] = await Promise.all([
                    api.getOrganizations(),
                    api.getUsers(),
                    api.getStaff()
                ]);
                console.log('[DataContext] Sysadmin login staffs:', staffData);
                setOrganizations(orgsData);
                setUsers(usersData);
                setStaffs(staffData);
            } catch (error) {
                console.error('Failed to load sysadmin data:', error);
            }
        } else if (data.user.role === 'manager' || data.user.role === 'staff') {
            try {
                const [staffData, usersData] = await Promise.all([
                    api.getStaff(),
                    api.getUsers()
                ]);
                setStaffs(staffData);
                setUsers(usersData);

                // Refresh venues to ensure org-scoped if necessary (though already fetched globally in loadInitialData for now)
                // Set activeVenueId
                const orgVenues = venues.filter(v => v.organizationId === data.user.organizationId);
                if (orgVenues.length > 0) {
                    const savedVenueId = localStorage.getItem('activeVenueId');
                    if (savedVenueId && orgVenues.some(v => v.id === savedVenueId)) {
                        setActiveVenueId(savedVenueId);
                    } else {
                        setActiveVenueId(orgVenues[0].id);
                    }
                }
            } catch (error) {
                console.error('Failed to load manager/staff data:', error);
            }
        }

        // [Global] Load Room Configurations for all administrative roles
        if (['sysadmin', 'manager', 'staff'].includes(data.user.role)) {
            try {
                const [types, features, promotions] = await Promise.all([
                    api.getRoomTypes(),
                    api.getRoomFeatures(),
                    api.getPromotions()
                ]);
                console.log('[DataContext] Loaded Room/Promo Config after Login:', { types, features, promotions });
                setRoomTypes(types);
                setRoomFeatures(features);
                setPromos(promotions);
            } catch (e) {
                console.error('Failed to load room/promo config after login:', e);
            }
        }
    };

    const login = async (identifier, password, orgCode) => {
        try {
            const data = await api.login(identifier, password, orgCode);
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
        // Determine redirect path based on user role
        let redirectPath = '/';
        if (currentUser) {
            if (currentUser.role === 'sysadmin') {
                redirectPath = '/sysadmin';
            } else if (currentUser.role === 'manager' || currentUser.role === 'staff') {
                redirectPath = '/staff/login';
            }
        }

        setCurrentUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');

        return redirectPath;
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
            const updatedUser = await api.updateProfile(profileData, currentUser?.userType);
            setCurrentUser(prev => ({ ...prev, ...updatedUser }));
            localStorage.setItem('user', JSON.stringify({ ...currentUser, ...updatedUser }));
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

    const updateVenueStatus = async (id, isActive) => {
        try {
            const updated = await api.updateVenueStatus(id, isActive);
            setVenues(prev => prev.map(v => (v.id === id ? { ...v, ...updated } : v)));
            return updated;
        } catch (error) {
            console.error('Failed to update venue status:', error);
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
            // Set as active reservation if it's in RESERVED status
            if (newBooking.status === 'RESERVED' || newBooking.status === 'reserved') {
                setActiveBooking(newBooking);
                setShowResumeModal(true); // Auto-open payment when reserved
            }
            return newBooking;
        } catch (error) {
            console.error('Failed to create booking:', error);
            throw error;
        }
    };

    const extendBookingReservation = async (bookingId) => {
        if (isExtending) return;
        setIsExtending(true);
        try {
            const updated = await api.extendBookingReservation(bookingId);
            setActiveBooking(updated);
            // Also update in the bookings list if present
            setBookings(prev => prev.map(b => b.id === bookingId ? updated : b));
            return updated;
        } catch (error) {
            console.error('Extension failed:', error);
            throw error;
        } finally {
            setIsExtending(false);
        }
    };


    const updateBookingStatus = async (id, status) => {
        try {
            await api.updateBooking(id, { status });
            setBookings(prev => prev.map(b => (b.id === id ? { ...b, status } : b)));
            if (activeBooking && activeBooking.id === id && status !== 'RESERVED') {
                setActiveBooking(null);
            }
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

    const confirmBookingPayment = async (id, paymentData) => {
        try {
            const updated = await api.confirmBookingPayment(id, paymentData);
            setBookings(prev => prev.map(b => (b.id === id ? updated : b)));
            if (activeBooking && activeBooking.id === id) {
                setActiveBooking(null);
            }
            return updated;
        } catch (error) {
            console.error('Failed to confirm booking payment:', error);
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

    const updateBooking = async (id, data) => {
        try {
            const updated = await api.updateBooking(id, data);
            setBookings(prev => prev.map(b => (b.id === id ? updated : b)));
            return updated;
        } catch (error) {
            console.error('Failed to update booking:', error);
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
                venueId: venueId.toString(),
                condition: roomData.condition || 'Good',
                amenities: roomData.amenities || [],
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

    const updateRoomStatus = async (venueId, roomId, isActive) => {
        try {
            const updated = await api.updateRoomStatus(roomId, isActive);
            setVenues(prev =>
                prev.map(v => {
                    if (v.id === venueId) {
                        return {
                            ...v,
                            rooms: v.rooms.map(r => (r.id === roomId ? updated : r))
                        };
                    }
                    return v;
                })
            );
            return updated;
        } catch (error) {
            console.error('Failed to update room status:', error);
            throw error;
        }
    };

    const updateRoomSortOrders = async (venueId, orders) => {
        try {
            await api.reorderRooms(orders);
            // Refresh local state by updating sortOrder of affected rooms
            setVenues(prev =>
                prev.map(v => {
                    if (v.id === venueId) {
                        const updatedRooms = v.rooms.map(r => {
                            const orderItem = orders.find(o => o.roomId === r.id);
                            return orderItem ? { ...r, sortOrder: orderItem.sortOrder } : r;
                        }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                        return { ...v, rooms: updatedRooms };
                    }
                    return v;
                })
            );
        } catch (error) {
            console.error('Failed to update room sort orders:', error);
            throw error;
        }
    };

    const addRoomPricing = async (roomId, pricingData) => {
        try {
            const newPricing = await api.addRoomPricing(roomId, pricingData);
            setVenues(prev => prev.map(v => {
                const roomIndex = v.rooms?.findIndex(r => r.id === roomId);
                if (roomIndex !== -1) {
                    const updatedRooms = [...v.rooms];
                    updatedRooms[roomIndex] = {
                        ...updatedRooms[roomIndex],
                        pricing: [...(updatedRooms[roomIndex].pricing || []), newPricing]
                    };
                    return { ...v, rooms: updatedRooms };
                }
                return v;
            }));
            return newPricing;
        } catch (error) {
            console.error('Failed to add room pricing:', error);
            throw error;
        }
    };

    const removeRoomPricing = async (pricingId) => {
        try {
            await api.removeRoomPricing(pricingId);
            setVenues(prev => prev.map(v => {
                // Find venue containing this pricing? Hard to know venueId directly without generic search
                // But we iterate all venues/rooms to find where to remove
                const roomWithPricing = v.rooms?.find(r => r.pricing?.some(p => p.id === pricingId));
                if (roomWithPricing) {
                    const updatedRooms = v.rooms.map(r => {
                        if (r.id === roomWithPricing.id) {
                            return {
                                ...r,
                                pricing: r.pricing.filter(p => p.id !== pricingId)
                            };
                        }
                        return r;
                    });
                    return { ...v, rooms: updatedRooms };
                }
                return v;
            }));
        } catch (error) {
            console.error('Failed to remove room pricing:', error);
            throw error;
        }
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
        if (!code) return null;
        const normalizedCode = code.toUpperCase();
        const promo = promos.find(p => p.code.toUpperCase() === normalizedCode && p.isActive);
        if (!promo) return null;

        const now = new Date();
        if (now < new Date(promo.validFrom) || now > new Date(promo.validTo)) {
            return null;
        }

        // Map to the format expected by the booking logic if necessary, 
        // or just return the promo object. 
        // The booking logic seems to expect discountPercent or discountAmount.
        return {
            ...promo,
            discountPercent: promo.discountType === 'PERCENT' ? promo.value : null,
            discountAmount: promo.discountType === 'FIXED' ? promo.value : null
        };
    };

    // Finance methods
    const addPayoutAccount = async (data) => {
        try {
            const newAccount = await api.addPayoutAccount(data);
            setPayoutAccounts(prev => [newAccount, ...prev]);
            return newAccount;
        } catch (error) {
            console.error('Failed to add payout account:', error);
            throw error;
        }
    };

    const requestPayout = async (data) => {
        try {
            const newPayout = await api.requestPayout(data);
            setPayouts(prev => [newPayout, ...prev]);
            // Refresh earnings after payout request since they change status
            const updatedEarnings = await api.getEarnings();
            setEarnings(updatedEarnings);
            return newPayout;
        } catch (error) {
            console.error('Failed to request payout:', error);
            throw error;
        }
    };

    const updatePayoutStatus = async (id, status) => {
        try {
            const updated = await api.updatePayoutStatus(id, status);
            setPayouts(prev => prev.map(p => p.id === id ? updated : p));
            return updated;
        } catch (error) {
            console.error('Failed to update payout status:', error);
            throw error;
        }
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

    const addStaff = async (staffData) => {
        try {
            const newStaff = await api.createStaff(staffData);
            setStaffs(prev => [newStaff, ...prev]);
            return newStaff;
        }
        catch (error) {
            console.error('Failed to add staff:', error);
            throw error;
        }
    };

    const updateUser = (id, updates) => {
        try {
            setUsers(prev =>
                prev.map(u => {
                    if (u.id === id) {
                        const updatedUser = { ...u, ...updates };
                        api.updateUser(id, updates);
                        return updatedUser;
                    }
                    return u;
                })
            );
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    };
    const toggleUserStatus = (id, role) => {
        try {
            setUsers(prev =>
                prev.map(u => {
                    if (u.id === id) {
                        const updatedUser = { ...u, isActive: !u.isActive };
                        if (role === 'customer') {
                            api.toggleUserStatus(id, { isActive: updatedUser.isActive });
                        } else {
                            // For staff, if deactivating, use deleteStaff (deactivate endpoint)
                            // If activating, use updateStaff
                            if (!updatedUser.isActive) {
                                api.deleteStaff(id);
                            } else {
                                api.updateStaff(id, { isActive: true });
                            }
                        }
                        return updatedUser;
                    }
                    return u;
                })
            );
        } catch (error) {
            console.error('Failed to toggle user status:', error);
            throw error;
        }
    };

    const toggleStaffStatus = async (id) => {
        try {
            const staff = staffs.find(s => s.id === id);
            if (!staff) return;

            const newStatus = !staff.isActive;
            await api.updateStaff(id, { isActive: newStatus });

            setStaffs(prev => prev.map(s => s.id === id ? { ...s, isActive: newStatus } : s));
        } catch (error) {
            console.error('Failed to toggle staff status:', error);
            throw error;
        }
    };

    const updateStaff = async (id, updates) => {
        try {
            const updated = await api.updateStaff(id, updates);
            setStaffs(prev => prev.map(s => s.id === id ? updated : s));
            return updated;
        } catch (error) {
            console.error('Failed to update staff:', error);
            throw error;
        }
    };
    const transactions = [];
    const updateOrganization = async (id, updates) => {
        try {
            const updated = await api.updateOrganization(id, updates);
            setOrganizations(prev => prev.map(o => (o.id === id ? updated : o)));
            return updated;
        } catch (error) {
            console.error('Failed to update organization:', error);
            throw error;
        }
    };

    const updateOrganizationStatus = async (id, isActive) => {
        try {
            const updated = await api.updateOrganizationStatus(id, isActive);
            setOrganizations(prev => prev.map(o => (o.id === id ? updated : o)));
            return updated;
        } catch (error) {
            console.error('Failed to update organization status:', error);
            throw error;
        }
    };

    const addPromotion = async (data) => {
        try {
            const newPromo = await api.createPromotion(data);
            setPromos(prev => [newPromo, ...prev]);
            return newPromo;
        } catch (error) {
            console.error('Failed to add promotion:', error);
            throw error;
        }
    };

    const deletePromotion = async (id) => {
        try {
            await api.deletePromotion(id);
            setPromos(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error('Failed to delete promotion:', error);
            throw error;
        }
    };

    // --- ROOM CONFIG HELPERS ---
    const addRoomType = async (data) => {
        const res = await api.post('/room-settings/types', data);
        setRoomTypes(prev => [...prev, res]);
        return res;
    };
    const updateRoomType = async (id, data) => {
        const res = await api.put(`/room-settings/types/${id}`, data);
        setRoomTypes(prev => prev.map(t => t.id === id ? res : t));
        return res;
    };
    const deleteRoomType = async (id) => {
        await api.delete(`/room-settings/types/${id}`);
        setRoomTypes(prev => prev.filter(t => t.id !== id));
    };

    const addRoomFeature = async (data) => {
        const res = await api.post('/room-settings/features', data);
        setRoomFeatures(prev => [...prev, res]);
        return res;
    };
    const updateRoomFeature = async (id, data) => {
        const res = await api.put(`/room-settings/features/${id}`, data);
        setRoomFeatures(prev => prev.map(f => f.id === id ? res : f));
        return res;
    };
    const deleteRoomFeature = async (id) => {
        await api.delete(`/room-settings/features/${id}`);
        setRoomFeatures(prev => prev.filter(f => f.id !== id));
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <DataContext.Provider
            value={{
                venues,
                addVenue,
                updateVenue,
                updateVenueStatus,
                deleteVenue,
                addRoom,
                updateRoom,
                deleteRoom,
                updateRoomStatus,
                updateRoomSortOrders,
                users,
                currentUser,
                organizations,
                setOrganizations,
                updateOrganization,
                updateOrganizationStatus,
                activeVenueId,
                setActiveVenueId,
                activeBooking,
                setActiveBooking,
                showResumeModal,
                setShowResumeModal,
                isExtending,
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
                staffs,
                addStaff,
                updateStaff,
                toggleStaffStatus,
                bookings,
                addBooking,
                updateBookingStatus,
                updateBooking,
                approveBooking,
                rejectBooking,
                confirmBookingPayment,
                extendBookingReservation,
                createManualBooking,
                processRefund,
                calculateTotal,
                addOrder,
                logIssue,
                transactions,
                earnings,
                payouts,
                payoutAccounts,
                addPayoutAccount,
                requestPayout,
                updatePayoutStatus,
                settings,
                setSettings,
                promos,
                addPromotion,
                deletePromotion,
                verifyPromoCode,
                refreshData: loadInitialData,
                roomTypes,
                roomFeatures,
                addRoomType,
                updateRoomType,
                deleteRoomType,
                addRoomFeature,
                updateRoomFeature,
                deleteRoomFeature,
                addRoomPricing,
                removeRoomPricing,
            }}
        >
            {children}
        </DataContext.Provider>
    );
};
