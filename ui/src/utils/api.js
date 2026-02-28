import axios from 'axios';

const getApiUrl = () => {
    // 1. Explicit Environment Variable (Highest Priority)
    let url = import.meta.env.VITE_API_URL;

    // Automatically force HTTPS for Production URLs to avoid "Mixed Content" errors
    if (url && url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
        console.warn('Insecure VITE_API_URL detected in production. Upgrading to HTTPS.');
        url = url.replace('http://', 'https://');
    }

    if (url) {
        return url;
    }

    const hostname = window.location.hostname;

    // 2. Localhost Development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://${hostname}:3001`;
    }

    // 3. Fallback for deployed environments
    console.warn('VITE_API_URL is not set. Falling back to current hostname.');
    return window.location.origin;
};

const API_URL = getApiUrl();

const apiInstance = axios.create({
    baseURL: API_URL + '/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const api = {
    // Auth
    login: async (identifier, password, orgCode) => { // identifier: username or phone
        const response = await apiInstance.post('/auth/login', { identifier, password, orgCode });
        return response.data;
    },
    signup: async (userData) => {
        const response = await apiInstance.post('/auth/signup', userData);
        return response.data;
    },
    getProfile: async () => {
        const response = await apiInstance.get('/auth/me');
        return response.data;
    },
    updateProfile: async (data, userType = 'customer') => {
        const endpoint = userType === 'staff' ? '/staff/profile' : '/users/profile';
        const response = await apiInstance.patch(endpoint, data);
        return response.data;
    },
    updateStaffProfile: async (data) => {
        const response = await apiInstance.patch('/staff/profile', data);
        return response.data;
    },
    getUsers: async () => {
        const response = await apiInstance.get('/users');
        return response.data;
    },
    createUser: async (userData) => {
        const response = await apiInstance.post('/users', userData);
        return response.data;
    },
    updateUser: async (id, data) => {
        const response = await apiInstance.patch(`/users/${id}`, data);
        return response.data;
    },
    toggleUserStatus: async (id, data) => {
        const response = await apiInstance.patch(`/users/${id}/status`, data);
        return response.data;
    },
    verifyAccount: async (code) => {
        const response = await apiInstance.post('/auth/verify', { code });
        return response.data;
    },
    resendVerification: async (identifier) => {
        const response = await apiInstance.post('/auth/resend-verification', { identifier });
        return response.data;
    },
    requestLoginOtp: async (identifier) => {
        const response = await apiInstance.post('/auth/login-otp-request', { identifier });
        return response.data;
    },
    loginWithOtp: async (identifier, code) => {
        const response = await apiInstance.post('/auth/login-otp', { identifier, code });
        return response.data;
    },
    forgotPassword: async (email) => {
        const response = await apiInstance.post('/auth/forgot-password', { email });
        return response.data;
    },
    resetPassword: async (token, password) => {
        const response = await apiInstance.post('/auth/reset-password', { token, password });
        return response.data;
    },

    // Venues
    getVenues: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const response = await apiInstance.get(`/venues${params ? '?' + params : ''}`);
        return response.data;
    },
    getVenue: async (id) => {
        const response = await apiInstance.get(`/venues/${id}`);
        return response.data;
    },
    createVenue: async (data) => {
        const response = await apiInstance.post('/venues', data);
        return response.data;
    },
    updateVenue: async (id, data) => {
        const response = await apiInstance.patch(`/venues/${id}`, data);
        return response.data;
    },
    deleteVenue: async (id) => {
        const response = await apiInstance.delete(`/venues/${id}`);
        return response.data;
    },
    updateVenueStatus: async (id, isActive) => {
        const response = await apiInstance.patch(`/venues/${id}/status`, { isActive });
        return response.data;
    },
    logPhoneReveal: async (venueId) => {
        const response = await apiInstance.post(`/venues/${venueId}/phone-reveal`);
        return response.data;
    },

    // Rooms
    createRoom: async (data) => {
        const response = await apiInstance.post('/rooms', data);
        return response.data;
    },
    updateRoom: async (id, data) => {
        const response = await apiInstance.patch(`/rooms/${id}`, data);
        return response.data;
    },
    deleteRoom: async (id) => {
        const response = await apiInstance.delete(`/rooms/${id}`);
        return response.data;
    },
    updateRoomStatus: async (id, isActive) => {
        const response = await apiInstance.patch(`/rooms/${id}/status`, { isActive });
        return response.data;
    },
    updateRoomOperationalStatus: async (id, status) => {
        const response = await apiInstance.patch(`/rooms/${id}/room-status`, { status });
        return response.data;
    },
    reorderRooms: async (orders) => {
        const response = await apiInstance.post('/rooms/reorder', orders);
        return response.data;
    },
    addRoomPricing: async (roomId, pricingData) => {
        const response = await apiInstance.post(`/rooms/${roomId}/pricing`, pricingData);
        return response.data;
    },
    removeRoomPricing: async (pricingId) => {
        const response = await apiInstance.delete(`/rooms/pricing/${pricingId}`);
        return response.data;
    },

    // Bookings
    getBookings: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const response = await apiInstance.get(`/bookings?${params}`);
        return response.data;
    },
    getBookingsAvailability: async (roomId, date) => {
        const response = await apiInstance.get(`/bookings/availability?roomId=${roomId}&date=${date}`);
        return response.data;
    },
    createBooking: async (data) => {
        const response = await apiInstance.post('/bookings', data);
        return response.data;
    },
    createManualBooking: async (data) => {
        const response = await apiInstance.post('/bookings/manual', data);
        return response.data;
    },
    approveBooking: async (id) => {
        const response = await apiInstance.patch(`/bookings/${id}/approve`);
        return response.data;
    },
    rejectBooking: async (id) => {
        const response = await apiInstance.patch(`/bookings/${id}/reject`);
        return response.data;
    },
    updateBooking: async (id, data) => {
        const response = await apiInstance.patch(`/bookings/${id}`, data);
        return response.data;
    },
    confirmBookingPayment: async (id, paymentData) => {
        const response = await apiInstance.patch(`/bookings/${id}/confirm-payment`, paymentData);
        return response.data;
    },
    extendBookingReservation: async (id) => {
        const response = await apiInstance.patch(`/bookings/${id}/extend-reservation`);
        return response.data;
    },
    extendBookingTime: async (id, data) => {
        const response = await apiInstance.patch(`/bookings/${id}/extend-time`, data);
        return response.data;
    },
    getBookingStatus: async (id) => {
        const response = await apiInstance.get(`/bookings/${id}/status`);
        return response.data;
    },

    // Audit
    getAuditLogs: async (filters = {}) => {
        // Clean up filters: remove null/undefined and ensure no nested objects are stringified poorly
        const cleanFilters = Object.entries(filters).reduce((acc, [key, val]) => {
            if (val !== null && val !== undefined && typeof val !== 'object') {
                acc[key] = val;
            }
            return acc;
        }, {});

        const params = new URLSearchParams(cleanFilters).toString();
        const response = await apiInstance.get(`/audit${params ? '?' + params : ''}`);
        return response.data;
    },

    // Payments
    getPayments: async () => {
        const response = await apiInstance.get('/payments');
        return response.data;
    },
    createPayment: async (data) => {
        const response = await apiInstance.post('/payments', data);
        return response.data;
    },

    // QPay
    createQpayInvoice: async (bookingId) => {
        const response = await apiInstance.post('/payments/qpay/create-invoice', { bookingId });
        return response.data;
    },
    checkQpayPayment: async (paymentId) => {
        const response = await apiInstance.post(`/payments/qpay/check-payment/${paymentId}`);
        return response.data;
    },

    // Plans
    getPlans: async () => {
        const response = await apiInstance.get('/plans');
        return response.data;
    },

    // Organizations
    getOrganizations: async () => {
        const response = await apiInstance.get('/organizations');
        return response.data;
    },
    createOrganization: async (data) => {
        const response = await apiInstance.post('/organizations', data);
        return response.data;
    },
    getOrganization: async (id) => {
        const response = await apiInstance.get(`/organizations/${id}`);
        return response.data;
    },
    updateOrganization: async (id, data) => {
        const response = await apiInstance.patch(`/organizations/${id}`, data);
        return response.data;
    },
    updateOrganizationStatus: async (id, isActive) => {
        const response = await apiInstance.patch(`/organizations/${id}/status`, { isActive });
        return response.data;
    },
    extendOrganizationPlan: async (id, data) => {
        const response = await apiInstance.post(`/organizations/${id}/extend-plan`, data);
        return response.data;
    },

    // Staff
    getStaff: async (organizationId) => {
        const query = organizationId ? `?organizationId=${organizationId}` : '';
        const response = await apiInstance.get(`/staff${query}`);
        return response.data;
    },
    createStaff: async (data) => {
        const response = await apiInstance.post('/staff', data);
        return response.data;
    },
    updateStaff: async (id, data) => {
        const response = await apiInstance.patch(`/staff/${id}`, data);
        return response.data;
    },
    deleteStaff: async (id) => {
        const response = await apiInstance.delete(`/staff/${id}`);
        return response.data;
    },

    // Room Settings
    getRoomTypes: async () => {
        const response = await apiInstance.get('/room-settings/types');
        return response.data;
    },
    getRoomFeatures: async () => {
        const response = await apiInstance.get('/room-settings/features');
        return response.data;
    },

    // Generic HTTP methods for flexible API calls
    get: async (url) => {
        const response = await apiInstance.get(url);
        return response.data;
    },
    post: async (url, data) => {
        const response = await apiInstance.post(url, data);
        return response.data;
    },
    put: async (url, data) => {
        const response = await apiInstance.put(url, data);
        return response.data;
    },
    patch: async (url, data) => {
        const response = await apiInstance.patch(url, data);
        return response.data;
    },
    delete: async (url) => {
        const response = await apiInstance.delete(url);
        return response.data;
    },

    // Files
    // Finance
    getEarnings: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const response = await apiInstance.get(`/finance/earnings${query ? '?' + query : ''}`);
        return response.data;
    },
    getTotalEarnings: async (status, organizationId) => {
        let url = `/finance/earnings/total`;
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (organizationId) params.append('organizationId', organizationId);
        const query = params.toString();
        const response = await apiInstance.get(`${url}${query ? '?' + query : ''}`);
        return response.data;
    },
    getPayouts: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const response = await apiInstance.get(`/finance/payouts${query ? '?' + query : ''}`);
        return response.data;
    },
    getPayoutAccounts: async (organizationId) => {
        const query = organizationId ? `?organizationId=${organizationId}` : '';
        const response = await apiInstance.get(`/finance/payout-accounts${query}`);
        return response.data;
    },
    addPayoutAccount: async (data) => {
        const response = await apiInstance.post('/finance/payout-accounts', data);
        return response.data;
    },
    updatePayoutAccount: async (id, data) => {
        const response = await apiInstance.patch(`/finance/payout-accounts/${id}`, data);
        return response.data;
    },
    deletePayoutAccount: async (id) => {
        const response = await apiInstance.delete(`/finance/payout-accounts/${id}`);
        return response.data;
    },
    requestPayout: async (data) => {
        const response = await apiInstance.post('/finance/payout-request', data);
        return response.data;
    },
    updatePayoutStatus: async (id, status) => {
        const response = await apiInstance.patch(`/finance/payouts/${id}/status`, { status });
        return response.data;
    },

    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiInstance.post('/uploads', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Promotions
    getPromotions: async ({ includeInactive = false } = {}) => {
        const response = await apiInstance.get('/promotions', { params: { includeInactive } });
        return response.data;
    },
    createPromotion: async (data) => {
        const response = await apiInstance.post('/promotions', data);
        return response.data;
    },
    deletePromotion: async (id) => {
        const response = await apiInstance.delete(`/promotions/${id}`);
        return response.data;
    },
    updatePromotion: async (id, data) => {
        const response = await apiInstance.patch(`/promotions/${id}`, data);
        return response.data;
    },
    validatePromotion: async (code) => {
        const response = await apiInstance.post('/promotions/validate', { code });
        return response.data;
    },
    validatePromoCodePublic: async (code, venueId) => {
        const response = await apiInstance.post('/promotions/validate-public', { code, venueId });
        return response.data;
    },

    // Notifications
    getUserNotifications: async (limit = 50) => {
        const response = await apiInstance.get(`/notifications?limit=${limit}`);
        return response.data;
    },
    getUnreadCount: async () => {
        const response = await apiInstance.get('/notifications/unread-count');
        return response.data;
    },
    markNotificationAsRead: async (id) => {
        const response = await apiInstance.patch(`/notifications/${id}/read`);
        return response.data;
    },
    markAllNotificationsAsRead: async () => {
        const response = await apiInstance.post('/notifications/read-all');
        return response.data;
    },
    deleteNotification: async (id) => {
        const response = await apiInstance.delete(`/notifications/${id}`);
        return response.data;
    },

    getFileUrl: (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        // Gallery avatars are served from frontend public folder
        // Robust handling for both /avatars/ and avatars/
        if (path.startsWith('/avatars/') || path.startsWith('avatars/')) {
            return path.startsWith('/') ? path : '/' + path;
        }
        const base = API_URL;
        return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
    }
};
